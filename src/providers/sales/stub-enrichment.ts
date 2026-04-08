import { generateText } from "@/providers/generate-text.js";
import type { LeadEnrichmentProvider, CompanyData, ContactData } from "../../services/sales/types.js";

const MODEL = "gemini-2.5-flash";

export class StubEnrichmentProvider implements LeadEnrichmentProvider {
  name = "stub-enrichment";

  isAvailable(): boolean {
    return true;
  }

  async enrichCompany(domain: string): Promise<CompanyData> {
    const prompt = `Given the domain "${domain}", generate a plausible company profile as JSON with these exact fields:
- name (string), domain (string), industry (string), employeeCount (number or null),
- annualRevenue (string like "$1M-$5M" or null), techStack (string[]),
- socialProfiles (Record<string, string>), description (string),
- location ({ country: string, city: string })

Mark output as "[SYNTHETIC]" in description. Respond ONLY with valid JSON.`;

    const result = await generateText(
      MODEL,
      "You are a synthetic business data generator. Output realistic but clearly synthetic company profiles.",
      prompt,
    );

    try {
      const fenceMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
      return JSON.parse(fenceMatch ? fenceMatch[1].trim() : result.trim());
    } catch {
      return {
        name: domain.split(".")[0],
        domain,
        industry: "Technology",
        employeeCount: null,
        annualRevenue: null,
        techStack: [],
        socialProfiles: {},
        description: `[SYNTHETIC] Company at ${domain}`,
        location: { country: "Unknown", city: "Unknown" },
      };
    }
  }

  async enrichContact(email: string): Promise<ContactData> {
    const prompt = `Given the email "${email}", generate a plausible contact profile as JSON:
- fullName (string), jobTitle (string or null), department (string or null),
- linkedinUrl (string or null), phone (string or null),
- seniority ("c-level"|"vp"|"director"|"manager"|"individual"|"unknown")

Output synthetic but realistic data. Respond ONLY with valid JSON.`;

    const result = await generateText(
      MODEL,
      "You are a synthetic contact data generator.",
      prompt,
    );

    try {
      const fenceMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
      return JSON.parse(fenceMatch ? fenceMatch[1].trim() : result.trim());
    } catch {
      const namePart = email.split("@")[0].replace(/[._-]/g, " ");
      return {
        fullName: namePart,
        jobTitle: null,
        department: null,
        linkedinUrl: null,
        phone: null,
        seniority: "unknown",
      };
    }
  }
}
