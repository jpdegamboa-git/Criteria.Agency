export function buildStubPrompt(
  providerType: string,
  context: Record<string, unknown>,
  instruction: string,
): string {
  const contextStr = Object.entries(context)
    .map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`)
    .join("\n");

  return `You are a synthetic data generator for the "${providerType}" data provider.

Context:
${contextStr}

Instructions: ${instruction}

IMPORTANT: This is synthetic data — mark output as "synthetic data — no live monitoring active".

Respond with a JSON array. No explanation, just valid JSON.`;
}

export function parseStubResponse(response: string): unknown[] {
  const fenceMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fenceMatch ? fenceMatch[1].trim() : response.trim();
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

export class StubProviderFactory {
  private generateFn: (prompt: string) => Promise<string>;

  constructor(generateFn: (prompt: string) => Promise<string>) {
    this.generateFn = generateFn;
  }

  async fetch(
    providerType: string,
    context: Record<string, unknown>,
    instruction: string,
  ): Promise<unknown[]> {
    const prompt = buildStubPrompt(providerType, context, instruction);
    const response = await this.generateFn(prompt);
    return parseStubResponse(response);
  }
}
