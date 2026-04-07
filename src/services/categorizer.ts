import { db, schema } from "../db/index.js";
import { eq, desc, isNotNull } from "drizzle-orm";
import { generateText } from "../providers/generate-text.js";

// ── Types ──

export interface CategorizationResult {
  category: string;
  subcategory: string | null;
  type: "income" | "expense" | "transfer" | "fee";
  confidence: number;
  source: "fixed" | "learned" | "alias" | "ai";
}

interface TransactionInput {
  description: string;
  counterpartyName?: string | null;
  amount: string | number;
  date?: Date | null;
  reference?: string | null;
  aliases?: { id: string; clientId: string; alias: string }[];
}

// ── Stop words for learning ──

const STOP_WORDS = new Set([
  "the", "and", "for", "from", "with", "that", "this", "was", "are",
  "has", "had", "have", "not", "but", "por", "para", "con", "del",
  "los", "las", "una", "que", "pago", "cargo", "num", "ref", "cta",
  "de", "en", "el", "la", "no", "se",
]);

// ── Available categories for AI prompt ──

const AVAILABLE_CATEGORIES = [
  "subscription", "bank_fees", "interest", "internal_transfer",
  "client_payment", "contractor", "software", "hosting",
  "advertising", "office", "travel", "meals", "insurance",
  "taxes", "salary", "equipment", "other_income", "other_expense",
];

// ── Main function ──

export async function categorizeTransaction(
  transaction: TransactionInput
): Promise<CategorizationResult> {
  const upperDesc = transaction.description.toUpperCase();
  const counterparty = (transaction.counterpartyName ?? "").toUpperCase();
  const amount = typeof transaction.amount === "string"
    ? parseFloat(transaction.amount)
    : transaction.amount;

  // 1. Fixed rules (hardcoded)
  const fixedResult = matchFixedRules(upperDesc);
  if (fixedResult) return fixedResult;

  // 2. Learned rules from DB
  const learnedResult = await matchLearnedRules(upperDesc, counterparty);
  if (learnedResult) return learnedResult;

  // 3. Client alias match (income only)
  if (amount > 0 && counterparty) {
    const aliasResult = await matchClientAlias(counterparty, transaction.aliases);
    if (aliasResult) return aliasResult;
  }

  // 4. Claude AI fallback
  return classifyWithAI(transaction, amount);
}

// ── Step 1: Fixed rules ──

function matchFixedRules(upperDesc: string): CategorizationResult | null {
  if (upperDesc.includes("STRIPE")) {
    return { category: "subscription", subcategory: null, type: "income", confidence: 1.0, source: "fixed" };
  }

  if (
    upperDesc.includes("COMISION") ||
    upperDesc.includes("COMMISSION") ||
    upperDesc.includes("FEE") ||
    upperDesc.includes("CARGO BANCARIO")
  ) {
    return { category: "bank_fees", subcategory: null, type: "fee", confidence: 1.0, source: "fixed" };
  }

  if (upperDesc.includes("INTERES") || upperDesc.includes("INTEREST")) {
    return { category: "interest", subcategory: null, type: "income", confidence: 0.95, source: "fixed" };
  }

  if (
    upperDesc.includes("TRANSFERENCIA PROPIA") ||
    upperDesc.includes("OWN TRANSFER") ||
    upperDesc.includes("TRASPASO")
  ) {
    return { category: "internal_transfer", subcategory: null, type: "transfer", confidence: 0.95, source: "fixed" };
  }

  return null;
}

// ── Step 2: Learned rules ──

async function matchLearnedRules(
  upperDesc: string,
  counterparty: string
): Promise<CategorizationResult | null> {
  const rules = await db
    .select()
    .from(schema.categorizationRules)
    .orderBy(desc(schema.categorizationRules.priority));

  const combined = `${upperDesc} ${counterparty}`;

  for (const rule of rules) {
    const pattern = rule.pattern.toUpperCase();
    let matched = false;

    switch (rule.matchType) {
      case "contains":
        matched = combined.includes(pattern);
        break;
      case "exact":
        matched = combined === pattern;
        break;
      case "regex":
        try {
          matched = new RegExp(rule.pattern, "i").test(combined);
        } catch {
          matched = false;
        }
        break;
    }

    if (matched) {
      return {
        category: rule.category,
        subcategory: rule.subcategory,
        type: rule.transactionType,
        confidence: 0.9,
        source: "learned",
      };
    }
  }

  return null;
}

// ── Step 3: Client alias match ──

async function matchClientAlias(
  counterparty: string,
  aliases?: { id: string; clientId: string; alias: string }[],
): Promise<CategorizationResult | null> {
  const resolvedAliases = aliases ?? await db.select().from(schema.clientAliases);

  for (const entry of resolvedAliases) {
    if (counterparty.includes(entry.alias.toUpperCase())) {
      return {
        category: "client_payment",
        subcategory: null,
        type: "income",
        confidence: 0.95,
        source: "alias",
      };
    }
  }

  return null;
}

// ── Step 4: Claude AI fallback ──

async function classifyWithAI(
  transaction: TransactionInput,
  amount: number
): Promise<CategorizationResult> {
  try {
    // Fetch last 10 categorized transactions as examples
    const examples = await db
      .select({
        description: schema.transactions.description,
        category: schema.transactions.category,
        type: schema.transactions.type,
        amount: schema.transactions.amount,
      })
      .from(schema.transactions)
      .where(isNotNull(schema.transactions.category))
      .orderBy(desc(schema.transactions.createdAt))
      .limit(10);

    const examplesText = examples.length > 0
      ? examples
          .map(
            (e) =>
              `- "${e.description}" → category: ${e.category}, type: ${e.type}, amount: ${e.amount}`
          )
          .join("\n")
      : "No previous examples available.";

    const system = `You are a financial transaction categorizer for a video production agency.
Available categories: ${AVAILABLE_CATEGORIES.join(", ")}.
Available types: income, expense, transfer, fee.
Respond ONLY with valid JSON: {"category": "...", "subcategory": "..." or null, "type": "..."}`;

    const prompt = `Categorize this transaction:
- Description: ${transaction.description}
- Counterparty: ${transaction.counterpartyName ?? "N/A"}
- Amount: ${transaction.amount}
- Date: ${transaction.date?.toISOString() ?? "N/A"}
- Reference: ${transaction.reference ?? "N/A"}

Previous categorized transactions for context:
${examplesText}

Respond ONLY with JSON.`;

    const response = await generateText("claude-haiku-4", system, prompt, 256);

    const parsed = JSON.parse(response);

    if (parsed._mock || !parsed.category) {
      return fallbackByAmount(amount);
    }

    return {
      category: parsed.category,
      subcategory: parsed.subcategory ?? null,
      type: parsed.type ?? (amount > 0 ? "income" : "expense"),
      confidence: 0.75,
      source: "ai",
    };
  } catch {
    return fallbackByAmount(amount);
  }
}

function fallbackByAmount(amount: number): CategorizationResult {
  return {
    category: amount > 0 ? "other_income" : "other_expense",
    subcategory: null,
    type: amount > 0 ? "income" : "expense",
    confidence: 0.5,
    source: "ai",
  };
}

// ── Learning function ──

export async function learnFromCorrection(
  description: string,
  category: string,
  subcategory: string | null,
  type: "income" | "expense" | "transfer" | "fee"
): Promise<void> {
  // Extract 2-3 distinctive words (≥3 chars, skip stop words)
  const words = description
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z0-9À-ÿ]/g, ""))
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w.toLowerCase()))
    .slice(0, 3);

  if (words.length === 0) return;

  const pattern = words.join(" ").toUpperCase();

  // Check if rule already exists for this pattern
  const existing = await db
    .select()
    .from(schema.categorizationRules)
    .where(eq(schema.categorizationRules.pattern, pattern))
    .limit(1);

  if (existing.length > 0) return;

  await db.insert(schema.categorizationRules).values({
    pattern,
    matchType: "contains",
    category,
    subcategory,
    transactionType: type,
    source: "auto",
    priority: 0,
  });
}
