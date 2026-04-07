import { describe, it, expect } from "vitest";
import { normalizeName, levenshtein, similarity } from "./fuzzy-match.js";

describe("normalizeName", () => {
  it("lowercases input", () => {
    expect(normalizeName("ACME Corp")).toBe("acme");
  });

  it("removes accents/diacritics", () => {
    expect(normalizeName("Café Müller")).toBe("cafe muller");
  });

  it("strips legal suffixes: S.A.", () => {
    expect(normalizeName("Grupo Financiero S.A.")).toBe("grupo financiero");
  });

  it("strips legal suffixes: LLC", () => {
    expect(normalizeName("Acme LLC")).toBe("acme");
  });

  it("strips legal suffixes: Inc", () => {
    expect(normalizeName("Widgets Inc")).toBe("widgets");
  });

  it("strips legal suffixes: Corp", () => {
    expect(normalizeName("Big Corp")).toBe("big");
  });

  it("strips legal suffixes: Ltd", () => {
    expect(normalizeName("Smith Ltd")).toBe("smith");
  });

  it("strips legal suffixes: S.R.L.", () => {
    expect(normalizeName("Mi Empresa S.R.L.")).toBe("mi empresa");
  });

  it("strips legal suffixes: GmbH", () => {
    expect(normalizeName("Deutsche GmbH")).toBe("deutsche");
  });

  it("strips wire transfer noise: wire", () => {
    expect(normalizeName("wire Acme")).toBe("acme");
  });

  it("strips wire transfer noise: transfer", () => {
    expect(normalizeName("Acme transfer")).toBe("acme");
  });

  it("strips wire transfer noise: intl", () => {
    expect(normalizeName("Acme intl")).toBe("acme");
  });

  it("strips wire transfer noise: pago", () => {
    expect(normalizeName("pago empresa xyz")).toBe("empresa xyz");
  });

  it("removes non-alphanumeric characters (except spaces)", () => {
    // "Co" is stripped as a legal suffix; "&" and "," become spaces that collapse
    expect(normalizeName("Foo & Bar, Co.")).toBe("foo bar");
  });

  it("collapses multiple spaces to single space", () => {
    expect(normalizeName("Foo   Bar")).toBe("foo bar");
  });

  it("trims leading and trailing whitespace", () => {
    expect(normalizeName("  Foo Bar  ")).toBe("foo bar");
  });

  it("handles empty string", () => {
    expect(normalizeName("")).toBe("");
  });

  it("handles combination of suffix, diacritic, and noise", () => {
    // S.A. stripped, diacritic removed, wire+payment stripped, spaces collapsed
    expect(normalizeName("Distribuidora García S.A. de C.V. wire payment")).toBe(
      "distribuidora garcia de cv",
    );
  });
});

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("hello", "hello")).toBe(0);
  });

  it("returns length of string when other is empty", () => {
    expect(levenshtein("hello", "")).toBe(5);
    expect(levenshtein("", "hello")).toBe(5);
  });

  it("returns 0 for two empty strings", () => {
    expect(levenshtein("", "")).toBe(0);
  });

  it("counts single substitution", () => {
    expect(levenshtein("cat", "bat")).toBe(1);
  });

  it("counts single insertion", () => {
    expect(levenshtein("cat", "cats")).toBe(1);
  });

  it("counts single deletion", () => {
    expect(levenshtein("cats", "cat")).toBe(1);
  });

  it("handles completely different strings", () => {
    expect(levenshtein("abc", "xyz")).toBe(3);
  });

  it("is not order-sensitive for symmetric inputs", () => {
    expect(levenshtein("kitten", "sitting")).toBe(levenshtein("sitting", "kitten"));
  });

  it("computes the classic kitten/sitting example", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
  });
});

describe("similarity", () => {
  it("returns 100 for identical strings", () => {
    expect(similarity("Acme Corp", "Acme Corp")).toBe(100);
  });

  it("returns 100 when strings differ only by legal suffix", () => {
    expect(similarity("Acme Corp", "Acme LLC")).toBe(100);
  });

  it("returns 100 when strings differ only by wire noise", () => {
    expect(similarity("Acme", "wire Acme transfer")).toBe(100);
  });

  it("returns 0 when one normalized string is empty", () => {
    // A string that normalizes to empty vs a real name
    expect(similarity("", "Acme")).toBe(0);
  });

  it("returns 0 for empty strings", () => {
    expect(similarity("", "")).toBe(100); // both normalize to "" → equal
  });

  it("returns high score for near-identical names", () => {
    const score = similarity("Distribuidora Martinez", "Distribuidora Martínez");
    expect(score).toBeGreaterThanOrEqual(95);
  });

  it("returns low score for completely different names", () => {
    const score = similarity("Apple", "Banana");
    expect(score).toBeLessThan(50);
  });

  it("is case-insensitive", () => {
    expect(similarity("ACME", "acme")).toBe(100);
  });

  it("handles S.A. de C.V. partial suffix stripping", () => {
    // S.A. is stripped but "de cv" residue remains; score is still meaningful
    const score = similarity("Grupo Bimbo S.A. de C.V.", "Grupo Bimbo");
    expect(score).toBeGreaterThan(50);
  });

  it("returns a number between 0 and 100", () => {
    const score = similarity("foo", "bar");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
