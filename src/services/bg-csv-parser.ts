import { createHash } from "crypto";

export interface ParsedTransaction {
  externalId: string;
  date: Date;
  amount: string;
  currency: string;
  description: string;
  counterpartyName: string;
  reference: string;
  type: "income" | "expense";
  source: "csv_import";
  metadata: Record<string, any>;
}

/**
 * Parse a Banco General bank statement .txt file (semicolon-delimited, 7 columns).
 *
 * Format: Fecha;Referencia;Transaccion;Descripcion;Debito;Credito;Saldo capital
 */
export function parseBGFile(
  content: string,
  accountId: string,
): ParsedTransaction[] {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Skip header row
  if (lines.length === 0) return [];
  const header = lines[0];
  if (header.toLowerCase().startsWith("fecha")) {
    lines.shift();
  }

  return lines.map((line) => parseLine(line, accountId));
}

function parseLine(line: string, accountId: string): ParsedTransaction {
  const cols = line.split(";");
  if (cols.length < 7) {
    throw new Error(`Invalid line (expected 7 columns): ${line}`);
  }

  const [dateStr, ref, _txCode, description, debitStr, creditStr, _balance] =
    cols;

  const date = parseDate(dateStr.trim());
  const debit = parseAmount(debitStr.trim());
  const credit = parseAmount(creditStr.trim());

  const isIncome = credit > 0;
  const rawAmount = isIncome ? credit : -debit;
  const amount = rawAmount.toFixed(2);

  const counterpartyName = extractCounterparty(description.trim());
  const reference = ref.trim();

  const hashInput = `${accountId}|${date.toISOString()}|${amount}|${description.trim()}`;
  const externalId = createHash("sha256").update(hashInput).digest("hex");

  return {
    externalId,
    date,
    amount,
    currency: "USD",
    description: description.trim(),
    counterpartyName,
    reference,
    type: isIncome ? "income" : "expense",
    source: "csv_import",
    metadata: {
      debit: debit || undefined,
      credit: credit || undefined,
      balance: parseAmount((_balance ?? "").trim()) || undefined,
      rawLine: line,
    },
  };
}

/** DD/MM/YYYY → Date */
function parseDate(s: string): Date {
  const [dd, mm, yyyy] = s.split("/");
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
}

/** Remove thousands commas and parse; empty string → 0 */
function parseAmount(s: string): number {
  if (!s) return 0;
  return parseFloat(s.replace(/,/g, ""));
}

/**
 * Extract a clean counterparty name from the raw BG description.
 * Rules are applied in priority order.
 */
function extractCounterparty(desc: string): string {
  let m: RegExpMatchArray | null;

  // 1. Card purchase: NAME-4560-34XX-XXXX-0913
  m = desc.match(/^(.+?)-\d{4}-\d{2}XX-XXXX-\d{4}$/);
  if (m) return cleanName(m[1]);

  // 2. Transfer from account number
  m = desc.match(/TRANSFERENCIA DE \d+ (.+?) BANCA EN LINEA/);
  if (m) return cleanName(m[1]);

  // 3. Transfer from name (no account number)
  m = desc.match(/TRANSFERENCIA DE ([A-Z\s]+?) BANCA EN LINEA/);
  if (m) return cleanName(m[1]);

  // 4. Transfer to
  m = desc.match(/TRANSFERENCIA A \d+ (.+?) BANCA EN LINE/);
  if (m) return cleanName(m[1]);

  // 5. International wire (TRR)
  m = desc.match(/^TRR\d+\s+(.+?)(?:\s*\/\s*\d+)?$/);
  if (m) {
    let name = m[1];
    // Remove truncated parenthetical like "(NORTH AMERI"
    name = name.replace(/\s*\([^)]*$/, "");
    return cleanName(name);
  }

  // 6. Visa payment
  if (/PAGO VISA/.test(desc)) return "Pago Visa (propia)";

  // 7. Bank payment (BAC / Davivienda)
  m = desc.match(/BANCA EN LINEA (BAC INTERNATIONAL BANK|DAVIVIENDA)/i);
  if (m) return cleanName(m[1]);

  // 8. Generic online banking service payment
  m = desc.match(/BANCA EN LI[NÑ]EA (.+?)(?:\s*\(\d+\))?$/);
  if (m) return cleanName(m[1]);

  // 9. Commission
  if (/^COMISION/.test(desc)) return "Banco General";

  // 10. Insurance
  if (/^(SEGURO|IMPUESTO SEGURO)/.test(desc)) return "Banco General";

  // 11. Interest
  if (/^INTERES/.test(desc)) return "Banco General";

  // 12. Fallback
  return cleanName(desc);
}

/**
 * Clean up a counterparty name:
 * - Remove trailing numbers/codes
 * - Simple title case for long uppercase words, keep short acronyms
 */
function cleanName(raw: string): string {
  let name = raw.trim();

  // Remove trailing number/code sequences (e.g., "370240615011842", "02-2016-13655-1")
  name = name.replace(/\s+\d[\d\-]*\s*$/, "").trim();
  // Remove trailing alphanumeric codes that mix letters and digits (e.g., "8M9JL3")
  name = name.replace(/\s+(?=[A-Z0-9]*\d)[A-Z0-9]{4,}\s*$/, "").trim();

  // Title-case long uppercase words; keep short acronyms (LLC, S.A., RBS, etc.)
  name = name
    .split(/\s+/)
    .map((word) => titleCaseWord(word))
    .join(" ");

  return name.trim();
}

/** Title-case a single token, respecting acronyms and punctuation wrappers. */
function titleCaseWord(word: string): string {
  // Strip surrounding punctuation (parens, commas) for analysis
  const leading = word.match(/^([^A-Za-z0-9]*)/)?.[1] ?? "";
  const trailing = word.match(/([^A-Za-z0-9]*)$/)?.[1] ?? "";
  const core =
    trailing.length > 0
      ? word.slice(leading.length, -trailing.length)
      : word.slice(leading.length);

  if (!core) return word;

  // Keep words with dots (S.A., CORP.), short core (<=3 chars), or already mixed case
  if (core.length <= 3 || /\./.test(core)) return word;
  if (core !== core.toUpperCase()) return word;

  // Handle hyphenated compounds like EDEMET-EDECHI
  if (core.includes("-")) {
    const parts = core.split("-").map((p) => {
      if (p.length <= 3) return p;
      return p.charAt(0) + p.slice(1).toLowerCase();
    });
    return leading + parts.join("-") + trailing;
  }

  // Title-case the core
  const titled = core.charAt(0) + core.slice(1).toLowerCase();
  return leading + titled + trailing;
}
