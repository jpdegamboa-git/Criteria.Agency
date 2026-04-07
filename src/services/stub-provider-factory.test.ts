import { describe, it, expect } from "vitest";
import { buildStubPrompt, parseStubResponse, StubProviderFactory } from "./stub-provider-factory";

describe("StubProviderFactory", () => {
  describe("buildStubPrompt", () => {
    it("builds a prompt with provider type and context", () => {
      const prompt = buildStubPrompt(
        "social_mentions",
        { brandName: "Criteria", industry: "marketing" },
        "Generate 5-10 realistic social media mentions",
      );
      expect(prompt).toContain("social_mentions");
      expect(prompt).toContain("Criteria");
      expect(prompt).toContain("marketing");
      expect(prompt).toContain("synthetic data");
    });
  });

  describe("parseStubResponse", () => {
    it("parses valid JSON from code fences", () => {
      const response = '```json\n[{"text": "hello"}]\n```';
      expect(parseStubResponse(response)).toEqual([{ text: "hello" }]);
    });
    it("parses raw JSON without fences", () => {
      expect(parseStubResponse('[{"text": "hello"}]')).toEqual([{ text: "hello" }]);
    });
    it("returns empty array for unparseable response", () => {
      expect(parseStubResponse("not json")).toEqual([]);
    });
    it("wraps single object in array", () => {
      expect(parseStubResponse('{"text": "hello"}')).toEqual([{ text: "hello" }]);
    });
  });

  describe("StubProviderFactory.fetch", () => {
    it("calls generateFn and parses response", async () => {
      const mockGenerate = async () => '[{"result": true}]';
      const factory = new StubProviderFactory(mockGenerate);
      const result = await factory.fetch("test", { key: "val" }, "generate data");
      expect(result).toEqual([{ result: true }]);
    });
  });
});
