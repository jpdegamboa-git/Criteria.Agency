import { describe, it, expect } from "vitest";
import {
  TIER_CAPABILITIES,
  getCapabilitiesForTier,
} from "./tier-capabilities.js";

describe("tier-capabilities", () => {
  it("PyME has ~15 capabilities", () => {
    const pyme = TIER_CAPABILITIES.pyme;
    expect(pyme.length).toBeGreaterThanOrEqual(14);
    expect(pyme.length).toBeLessThanOrEqual(16);
  });

  it("Mediana includes all PyME capabilities", () => {
    const pyme = TIER_CAPABILITIES.pyme;
    const mediana = getCapabilitiesForTier("mediana");
    for (const cap of pyme) {
      expect(mediana).toContain(cap);
    }
  });

  it("Mediana includes its own capabilities beyond PyME", () => {
    const pyme = TIER_CAPABILITIES.pyme;
    const mediana = getCapabilitiesForTier("mediana");
    expect(mediana.length).toBeGreaterThan(pyme.length);
  });

  it("Agencia includes all Mediana capabilities", () => {
    const mediana = getCapabilitiesForTier("mediana");
    const agencia = getCapabilitiesForTier("agencia");
    for (const cap of mediana) {
      expect(agencia).toContain(cap);
    }
  });

  it("Agencia includes its own capabilities beyond Mediana", () => {
    const mediana = getCapabilitiesForTier("mediana");
    const agencia = getCapabilitiesForTier("agencia");
    expect(agencia.length).toBeGreaterThan(mediana.length);
  });

  it("No duplicates in merged PyME set", () => {
    const caps = getCapabilitiesForTier("pyme");
    const unique = new Set(caps);
    expect(unique.size).toBe(caps.length);
  });

  it("No duplicates in merged Mediana set", () => {
    const caps = getCapabilitiesForTier("mediana");
    const unique = new Set(caps);
    expect(unique.size).toBe(caps.length);
  });

  it("No duplicates in merged Agencia set", () => {
    const caps = getCapabilitiesForTier("agencia");
    const unique = new Set(caps);
    expect(unique.size).toBe(caps.length);
  });

  it("All 50 capabilities (C-001 to C-049 + any others) appear in at least one tier", () => {
    const allCaps = new Set([
      ...TIER_CAPABILITIES.pyme,
      ...TIER_CAPABILITIES.mediana,
      ...TIER_CAPABILITIES.agencia,
    ]);
    // Verify the full agencia set covers all defined capabilities
    const agencia = getCapabilitiesForTier("agencia");
    const agenciaSet = new Set(agencia);
    for (const cap of allCaps) {
      expect(agenciaSet).toContain(cap);
    }
  });

  it("C-001 through C-011 are in PyME tier", () => {
    const pyme = TIER_CAPABILITIES.pyme;
    for (let i = 1; i <= 11; i++) {
      const cap = `C-${String(i).padStart(3, "0")}`;
      expect(pyme).toContain(cap);
    }
  });

  it("C-042, C-043, C-044 (scale) are exclusive to Agencia tier", () => {
    const pyme = TIER_CAPABILITIES.pyme;
    const medianaOwn = TIER_CAPABILITIES.mediana;
    for (const cap of ["C-042", "C-043", "C-044"]) {
      expect(pyme).not.toContain(cap);
      expect(medianaOwn).not.toContain(cap);
    }
  });

  it("C-048, C-049 (positioning) are exclusive to Agencia tier", () => {
    const pyme = TIER_CAPABILITIES.pyme;
    const medianaOwn = TIER_CAPABILITIES.mediana;
    for (const cap of ["C-048", "C-049"]) {
      expect(pyme).not.toContain(cap);
      expect(medianaOwn).not.toContain(cap);
    }
  });
});
