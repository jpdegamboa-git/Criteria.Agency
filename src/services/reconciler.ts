import { eq, and } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { generateText } from "../providers/generate-text.js";
import { normalizeName, similarity } from "../shared/fuzzy-match.js";

// ── Types ──

interface TransactionInput {
  id: string;
  amount: string;
  counterpartyName: string | null;
  date: Date;
  description: string;
  type: string | null;
}

export interface ReconciliationResult {
  matched: boolean;
  matchType: "exact" | "amount" | "fuzzy" | "ai" | "none";
  expectedPaymentId: string | null;
  clientId: string | null;
  confidence: number;
  autoReconciled: boolean;
}

// ── Types ──

export interface ClientAlias {
  id: string;
  clientId: string;
  alias: string;
}

// ── Client Lookup ──

export async function findClientByName(
  counterpartyName: string,
  aliases?: ClientAlias[],
): Promise<{ clientId: string; score: number } | null> {
  const normalized = normalizeName(counterpartyName);

  // 1. Check clientAliases for exact normalized match
  const resolvedAliases = aliases ?? await db.select().from(schema.clientAliases);
  for (const alias of resolvedAliases) {
    if (normalizeName(alias.alias) === normalized) {
      return { clientId: alias.clientId, score: 100 };
    }
  }

  // 2. Check clients.name and clients.company with fuzzy similarity >= 85%
  const allClients = await db.select().from(schema.clients);
  let bestMatch: { clientId: string; score: number } | null = null;

  for (const client of allClients) {
    const nameScore = similarity(counterpartyName, client.name);
    const companyScore = client.company
      ? similarity(counterpartyName, client.company)
      : 0;
    const score = Math.max(nameScore, companyScore);

    if (score >= 85 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { clientId: client.id, score };
    }
  }

  return bestMatch;
}

// ── Main Reconciliation ──

export async function reconcileTransaction(
  transaction: TransactionInput,
  aliases?: ClientAlias[],
): Promise<ReconciliationResult> {
  const NO_MATCH: ReconciliationResult = {
    matched: false,
    matchType: "none",
    expectedPaymentId: null,
    clientId: null,
    confidence: 0,
    autoReconciled: false,
  };

  // Only process income transactions
  if (transaction.type !== "income") {
    return NO_MATCH;
  }

  const txAmount = parseFloat(transaction.amount);

  // Get all pending expected payments
  const pendingPayments = await db
    .select()
    .from(schema.expectedPayments)
    .where(eq(schema.expectedPayments.status, "pending"));

  if (pendingPayments.length === 0) {
    return NO_MATCH;
  }

  // Try to find client by counterparty name
  const clientMatch = transaction.counterpartyName
    ? await findClientByName(transaction.counterpartyName, aliases)
    : null;

  // ── Level 1: EXACT MATCH ──
  // Amount exact + findClientByName score >= 85% + clientId matches expectedPayment.clientId
  if (clientMatch && clientMatch.score >= 85) {
    const exactMatch = pendingPayments.find(
      (ep) =>
        parseFloat(ep.amount) === txAmount &&
        ep.clientId === clientMatch.clientId,
    );
    if (exactMatch) {
      return {
        matched: true,
        matchType: "exact",
        expectedPaymentId: exactMatch.id,
        clientId: clientMatch.clientId,
        confidence: 0.95,
        autoReconciled: true,
      };
    }
  }

  // ── Level 2: AMOUNT MATCH ──
  // Amount exact but no name match
  const amountMatches = pendingPayments.filter(
    (ep) => parseFloat(ep.amount) === txAmount,
  );
  if (amountMatches.length > 0) {
    return {
      matched: true,
      matchType: "amount",
      expectedPaymentId: amountMatches[0].id,
      clientId: amountMatches[0].clientId,
      confidence: 0.6,
      autoReconciled: false,
    };
  }

  // ── Level 3: FUZZY MATCH ──
  // Name >= 85% but amount differs <= 5%
  if (clientMatch && clientMatch.score >= 85) {
    const fuzzyMatch = pendingPayments.find((ep) => {
      const epAmount = parseFloat(ep.amount);
      if (epAmount === 0) return false;
      const diff = Math.abs(txAmount - epAmount) / epAmount;
      return diff <= 0.05 && ep.clientId === clientMatch.clientId;
    });
    if (fuzzyMatch) {
      return {
        matched: true,
        matchType: "fuzzy",
        expectedPaymentId: fuzzyMatch.id,
        clientId: clientMatch.clientId,
        confidence: 0.5,
        autoReconciled: false,
      };
    }
  }

  // ── Level 4: AI MATCH ──
  // Only for amounts > $100
  if (txAmount > 100) {
    const allClients = await db.select().from(schema.clients);

    const paymentsData = pendingPayments.map((ep) => ({
      id: ep.id,
      clientId: ep.clientId,
      amount: ep.amount,
      description: ep.description,
      dueDate: ep.dueDate.toISOString(),
    }));

    const clientsData = allClients.map((c) => ({
      id: c.id,
      name: c.name,
      company: c.company,
    }));

    const system = `You are a payment reconciliation assistant. Given a bank transaction and a list of expected payments with their clients, determine the best match. Respond ONLY with valid JSON.`;

    const prompt = `Match this transaction to the most likely expected payment.

Transaction:
- Amount: ${transaction.amount}
- Counterparty: ${transaction.counterpartyName ?? "unknown"}
- Description: ${transaction.description}
- Date: ${transaction.date.toISOString()}

Expected payments (pending):
${JSON.stringify(paymentsData, null, 2)}

Clients:
${JSON.stringify(clientsData, null, 2)}

Respond with JSON:
{
  "expectedPaymentId": "<id or null>",
  "clientId": "<id or null>",
  "confidence": <0.0 to 1.0>,
  "reasoning": "<brief explanation>"
}`;

    try {
      const raw = await generateText("claude-haiku-4", system, prompt, 512);

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          expectedPaymentId: string | null;
          clientId: string | null;
          confidence: number;
        };

        if (parsed.confidence >= 0.9) {
          return {
            matched: true,
            matchType: "ai",
            expectedPaymentId: parsed.expectedPaymentId,
            clientId: parsed.clientId,
            confidence: parsed.confidence,
            autoReconciled: true,
          };
        } else if (parsed.confidence >= 0.5) {
          return {
            matched: true,
            matchType: "ai",
            expectedPaymentId: parsed.expectedPaymentId,
            clientId: parsed.clientId,
            confidence: parsed.confidence,
            autoReconciled: false,
          };
        }
      }
    } catch (err) {
      console.error("[reconciler] AI match failed:", err);
    }
  }

  return NO_MATCH;
}

// ── Apply Reconciliation ──

export async function applyReconciliation(
  transactionId: string,
  expectedPaymentId: string,
  clientId: string,
  counterpartyName: string | null,
): Promise<void> {
  // 1. Update transaction
  await db
    .update(schema.transactions)
    .set({
      reconciled: 1,
      reconciledWithId: expectedPaymentId,
      clientId,
      category: "client_payment",
    })
    .where(eq(schema.transactions.id, transactionId));

  // 2. Update expectedPayment
  await db
    .update(schema.expectedPayments)
    .set({
      status: "reconciled",
      reconciledTransactionId: transactionId,
    })
    .where(eq(schema.expectedPayments.id, expectedPaymentId));

  // 3. Save counterpartyName as clientAlias (if not exists)
  if (counterpartyName) {
    const normalized = normalizeName(counterpartyName);
    const existingAliases = await db
      .select()
      .from(schema.clientAliases)
      .where(eq(schema.clientAliases.clientId, clientId));

    const alreadyExists = existingAliases.some(
      (a) => normalizeName(a.alias) === normalized,
    );

    if (!alreadyExists) {
      await db.insert(schema.clientAliases).values({
        clientId,
        alias: counterpartyName,
      });
    }
  }

  // 4. Activate subscription if null or past_due
  const [client] = await db
    .select()
    .from(schema.clients)
    .where(eq(schema.clients.id, clientId));

  if (
    client &&
    (client.subscriptionStatus === null ||
      client.subscriptionStatus === "past_due")
  ) {
    await db
      .update(schema.clients)
      .set({ subscriptionStatus: "active" })
      .where(eq(schema.clients.id, clientId));
  }

  // 5. Create next expectedPayment (+1 month, same amount)
  const [reconciledPayment] = await db
    .select()
    .from(schema.expectedPayments)
    .where(eq(schema.expectedPayments.id, expectedPaymentId));

  if (reconciledPayment) {
    const nextDueDate = new Date(reconciledPayment.dueDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    await db.insert(schema.expectedPayments).values({
      clientId,
      amount: reconciledPayment.amount,
      currency: reconciledPayment.currency,
      description: reconciledPayment.description,
      dueDate: nextDueDate,
      status: "pending",
    });
  }
}
