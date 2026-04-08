/**
 * Safely parse a JSON string, returning a fallback value on failure.
 * Handles markdown code fences (```json ... ```) produced by LLMs.
 */
export function parseJsonSafe<T>(text: string, fallback: T): T {
  try {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const raw = fenceMatch ? fenceMatch[1].trim() : text.trim();
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
