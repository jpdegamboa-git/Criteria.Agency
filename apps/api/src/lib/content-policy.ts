/**
 * Content Policy Checker — Step 7.7 (DEC-167, P2-11)
 *
 * Basic content safety checks on creation motor outputs before they are
 * delivered to clients or stored in the Output Registry.
 *
 * Checks:
 * 1. No explicit/adult content in AI-generated marketing copy
 * 2. No defamatory statements (competitor mentions with negative claims)
 * 3. No discriminatory language
 * 4. TOS disclaimer injection for AI-generated content
 *
 * Uses pattern matching for speed. LLM-based check only for edge cases.
 * Classification uses Haiku (Tier A — output may contain client Brand DNA).
 *
 * Applied to: Web Motor (copy, blog posts), Brand Builder (identity outputs),
 * Strategist (campaign briefs delivered to client).
 * NOT applied to: internal step state, system logs, agent reasoning traces.
 */

import type { Database } from '@criteria/db';
import { classifyText, MODELS } from './ai.js';

// ── Prohibited content patterns ───────────────────────────────────────────────

const EXPLICIT_PATTERNS = [
  // No trailing \b — "pornographic" contains "porn" but word boundary after "porn" fails
  /\b(porn\w*|obscen\w*|explicit\s+sexual|adult\s+content)/i,
] as const;

const DISCRIMINATORY_PATTERNS = [
  /\b(racist|sexist|homophob|transphob|ableist|xenophob)\b/i,
  // Slurs are not enumerated here to avoid this file itself being flagged
] as const;

/** Regex to detect unsupported competitor comparison ("X is bad/worse/terrible") */
const DEFAMATORY_PATTERN =
  /\b(compet[ei]dor|rival|competencia)\b.{0,60}\b(malo|pésimo|terrible|fraude|estafa|ilegal)\b/i;

// ── TOS disclaimer ────────────────────────────────────────────────────────────

export const AI_CONTENT_DISCLAIMER =
  'Contenido generado con asistencia de inteligencia artificial. ' +
  'Revisa y aprueba antes de publicar.';

// ── Result types ──────────────────────────────────────────────────────────────

export interface ContentPolicyResult {
  approved: boolean;
  violations: string[];
  /** Sanitized content with disclaimer injected (only when approved) */
  content?: string;
}

// ── Main checker ──────────────────────────────────────────────────────────────

/**
 * Check AI-generated content against the content policy.
 *
 * @param content    - The generated text to check
 * @param contentType - What kind of content (for context in LLM check)
 * @param db         - Database (for LLM call)
 * @param tenantId   - Tenant ID
 * @param useLlm     - Run LLM-based check in addition to patterns (default: false)
 */
export async function checkContentPolicy(
  content: string,
  contentType: 'web_copy' | 'blog_post' | 'campaign_brief' | 'brand_identity' | 'general',
  _db: Database,
  tenantId: string,
  useLlm = false,
): Promise<ContentPolicyResult> {
  const violations: string[] = [];

  // 1. Explicit content
  for (const pattern of EXPLICIT_PATTERNS) {
    if (pattern.test(content)) {
      violations.push('explicit_content');
      break;
    }
  }

  // 2. Discriminatory language
  for (const pattern of DISCRIMINATORY_PATTERNS) {
    if (pattern.test(content)) {
      violations.push('discriminatory_language');
      break;
    }
  }

  // 3. Defamatory competitor statements
  if (DEFAMATORY_PATTERN.test(content)) {
    violations.push('potential_defamation');
  }

  // 4. Optional LLM-based check
  if (useLlm && violations.length === 0) {
    try {
      const result = await classifyText({
        ctx: { agentId: 'content-policy-checker', skillId: 'policy-check', tenantId },
        model: MODELS.haiku,
        system:
          'You are a content policy checker for a B2B marketing platform. ' +
          'Review the content and respond ONLY with JSON: ' +
          '{"approved": true/false, "violations": ["violation_type"]}. ' +
          'Flag: explicit sexual content, hate speech, defamatory competitor claims, ' +
          'illegal claims, privacy violations. Do NOT flag: competitive positioning, ' +
          'strong marketing language, industry criticism without false facts.',
        prompt: `Content type: ${contentType}\n\nContent to review:\n${content.slice(0, 1500)}`,
      });

      const jsonMatch = result.text.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.approved === false && Array.isArray(parsed.violations)) {
          violations.push(...parsed.violations);
        }
      }
    } catch {
      // Fail open — pattern matching already ran
    }
  }

  if (violations.length > 0) {
    return { approved: false, violations };
  }

  // Inject TOS disclaimer
  const contentWithDisclaimer = `${content}\n\n---\n*${AI_CONTENT_DISCLAIMER}*`;

  return {
    approved: true,
    violations: [],
    content: contentWithDisclaimer,
  };
}
