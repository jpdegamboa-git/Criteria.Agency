// ── Fuzzy Match Utilities ──
// Robust version: strips legal suffixes (S.A., LLC, etc.) and wire transfer noise.

const LEGAL_SUFFIXES =
  /\b(s\.a\.|s\.?a|llc|inc|corp|ltd|s\.r\.l\.?|s\.?r\.?l|gmbh|co)\b/g;
const WIRE_NOISE =
  /\b(wire|transfer|trf|intl|international|payment|pago)\b/g;

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(LEGAL_SUFFIXES, "")
    .replace(WIRE_NOISE, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

export function similarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return 100;
  if (na.length === 0 || nb.length === 0) return 0;

  const maxLen = Math.max(na.length, nb.length);
  const dist = levenshtein(na, nb);
  return Math.round(((maxLen - dist) / maxLen) * 100);
}
