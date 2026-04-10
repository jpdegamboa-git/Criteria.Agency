/**
 * Web Motor — Blog Post Pipeline (Continuous Mode, DEC-220, DEC-221)
 *
 * Separate, lightweight Inngest function for publishing blog posts into
 * an existing CMS site. Triggered after the project-mode pipeline has
 * delivered a site with blog CMS structure.
 *
 * Pipeline (spec §4.1):
 *   BRIEF → WRITER (Blog Post skill) → [G1 simplified: Brand Guardian only]
 *   → DESIGNER (optional, if custom imagery needed) → PUBLISH via CMS
 *
 * No G2 or G3 — CMS templates were validated during project mode.
 * CD evaluation only for high-importance posts (flag in brief).
 */

import { z } from 'zod';
import { tool } from 'ai';
import { inngest } from '../../client.js';
import {
  eq,
  and,
  organizationSettings,
  brandDnaArtifacts,
  webProjects,
  blogPosts,
} from '@criteria/db';
import type { Database } from '@criteria/db';
import { classifyText, runAgentWithTools, MODELS } from '../../../lib/ai.js';
import { loadPrompt } from '../../../lib/prompt-loader.js';

// ── Event schema ──────────────────────────────────────────────────────────────

const blogPostStartedSchema = z.object({
  tenantId: z.string().min(1),
  projectId: z.string().uuid(),
  brief: z.object({
    topic: z.string().min(1),
    keywords: z.array(z.string()).default([]),
    targetAudience: z.string().default(''),
    seoIntent: z.string().default(''),
    highImportance: z.boolean().default(false),
    needsCustomImagery: z.boolean().default(false),
  }),
});

export type BlogPostEventData = z.infer<typeof blogPostStartedSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function loadBrandDnaContext(db: Database, tenantId: string): Promise<string> {
  const artifacts = await db
    .select({ artifactType: brandDnaArtifacts.artifactType, content: brandDnaArtifacts.content, layer: brandDnaArtifacts.layer })
    .from(brandDnaArtifacts)
    .where(eq(brandDnaArtifacts.organizationId, tenantId))
    .limit(20);
  if (artifacts.length === 0) return 'No Brand DNA available yet.';
  return artifacts.map((a) => `[${a.artifactType} / Layer ${a.layer}]: ${JSON.stringify(a.content)}`).join('\n');
}

async function loadPromptWithFallback(db: Database, agentId: string, skillId: string, fallback: string): Promise<string> {
  try {
    const config = await loadPrompt(db, agentId, skillId);
    return config.systemPrompt;
  } catch {
    return fallback;
  }
}

// ── Brand Guardian simplified check ──────────────────────────────────────────

async function runBrandGuardianCheck(
  db: Database,
  tenantId: string,
  postContent: string,
  brandDnaContext: string,
): Promise<{ passed: boolean; fixGuidance: string }> {
  const systemPrompt = await loadPromptWithFallback(
    db, 'brand-guardian', 'textual-voice-review',
    `You are the Brand Guardian reviewing a blog post for brand voice consistency.
Check: voice, tone, vocabulary, brand personality match Brand DNA.
Respond with JSON: {"verdict":"pass|warning|fail","fixGuidance":"..."}`,
  );

  const result = await classifyText({
    ctx: { agentId: 'brand-guardian', skillId: 'textual-voice-review', tenantId },
    model: MODELS.sonnet,
    system: systemPrompt,
    prompt: `Brand DNA:\n${brandDnaContext}\n\nBlog Post:\n${postContent}\n\nEvaluate brand voice consistency.`,
  });

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as { verdict?: string; fixGuidance?: string };
      return {
        passed: parsed.verdict !== 'fail',
        fixGuidance: parsed.fixGuidance ?? '',
      };
    }
  } catch { /* fall through */ }

  return { passed: !result.text.toLowerCase().includes('fail'), fixGuidance: '' };
}

// ── Inngest function factory ───────────────────────────────────────────────────

export function createWebMotorBlogPostFn(db: Database) {
  return inngest.createFunction(
    {
      id: 'web-motor-blog-post',
      retries: 1,
      triggers: [{ event: 'web-motor/blog-post.started' as const }],
    },
    async ({ event, step }) => {
      // ── Validate schema + verify tenant (DEC-148) ─────────────────────────
      const { tenantId, projectId, brief } = await step.run('validate-schema', async () => {
        const result = blogPostStartedSchema.safeParse(event.data);
        if (!result.success) throw new Error(`Invalid schema: ${result.error.message}`);

        const [org] = await db
          .select({ organizationId: organizationSettings.organizationId })
          .from(organizationSettings)
          .where(eq(organizationSettings.organizationId, result.data.tenantId))
          .limit(1);
        if (!org) throw new Error(`Tenant not found: ${result.data.tenantId}`);

        // Verify project exists and has a blog
        const [project] = await db
          .select({ siteType: webProjects.siteType, status: webProjects.status })
          .from(webProjects)
          .where(and(eq(webProjects.id, result.data.projectId), eq(webProjects.organizationId, result.data.tenantId)))
          .limit(1);
        if (!project) throw new Error(`Project not found: ${result.data.projectId}`);
        if (project.status !== 'delivered') throw new Error(`Project is not delivered yet — blog posts require a delivered site`);

        return result.data;
      });

      // ── Write blog post (Writer, Blog Post skill) ─────────────────────────
      let postRecord: { id: string; title: string; slug: string } | null = null;

      await step.run('write-blog-post', async () => {
        const brandDnaContext = await loadBrandDnaContext(db, tenantId);
        const systemPrompt = await loadPromptWithFallback(
          db, 'writer', 'blog-post',
          `You are a blog writer producing high-quality content that follows the brand voice.
Produce a structured blog post with: title, subtitle, body (markdown with heading structure),
meta description, tags, categories. Follow Brand DNA verbal identity.`,
        );

        let generatedPost: Record<string, unknown> = {};

        const tools = {
          write_post: tool({
            description: 'Write the blog post',
            inputSchema: z.object({
              title: z.string(),
              subtitle: z.string().optional(),
              slug: z.string().describe('URL-safe slug'),
              body: z.string().describe('Full post body in markdown'),
              metaDescription: z.string().max(160),
              tags: z.array(z.string()),
              categories: z.array(z.string()),
              suggestedInternalLinks: z.array(z.string()).optional(),
            }),
            execute: async (params) => {
              generatedPost = params as Record<string, unknown>;
              return { saved: true };
            },
          }),
          read_brand_dna: tool({
            description: 'Read brand DNA for voice guidance',
            inputSchema: z.object({}),
            execute: async () => ({ brandDna: brandDnaContext }),
          }),
        };

        await runAgentWithTools({
          ctx: { agentId: 'writer', skillId: 'blog-post', tenantId },
          model: MODELS.sonnet,
          system: systemPrompt,
          prompt: `Write a blog post on: "${brief.topic}"\nKeywords: ${brief.keywords.join(', ')}\nAudience: ${brief.targetAudience}\nSEO intent: ${brief.seoIntent}\n\nBrand DNA: ${brandDnaContext}\n\nCall write_post when done.`,
          tools,
          maxSteps: 6,
        });

        // Create draft record in DB
        const [inserted] = await db.insert(blogPosts).values({
          projectId,
          organizationId: tenantId,
          title: (generatedPost.title as string) ?? brief.topic,
          slug: (generatedPost.slug as string) ?? brief.topic.toLowerCase().replace(/\s+/g, '-'),
          body: (generatedPost.body as string) ?? '',
          metaDescription: generatedPost.metaDescription as string | null,
          tags: (generatedPost.tags as string[]) ?? [],
          categories: (generatedPost.categories as string[]) ?? [],
          status: 'draft',
          inngestRunId: undefined,
        }).returning({ id: blogPosts.id, title: blogPosts.title, slug: blogPosts.slug });

        postRecord = inserted;
      });

      if (!postRecord) throw new Error('Blog post creation failed — no record returned');

      // ── Brand Guardian check (simplified G1) ──────────────────────────────
      const bgCheck = await step.run('brand-guardian-review', async () => {
        const brandDnaContext = await loadBrandDnaContext(db, tenantId);

        const [post] = await db
          .select({ body: blogPosts.body, title: blogPosts.title })
          .from(blogPosts)
          .where(eq(blogPosts.id, (postRecord as { id: string }).id))
          .limit(1);

        if (!post) return { passed: true, fixGuidance: '' };

        const postContent = `Title: ${post.title}\n\n${post.body}`;
        return runBrandGuardianCheck(db, tenantId, postContent, brandDnaContext);
      });

      if (!bgCheck.passed) {
        // Mark as needing revision — don't publish
        await db.update(blogPosts)
          .set({ status: 'draft' })
          .where(eq(blogPosts.id, (postRecord as { id: string }).id));
        return {
          status: 'brand_review_failed',
          postId: (postRecord as { id: string }).id,
          fixGuidance: bgCheck.fixGuidance,
        };
      }

      // ── Publish ────────────────────────────────────────────────────────────
      await step.run('publish', async () => {
        // In production: push to CMS (markdown file or headless CMS API)
        // MVP: mark as published in DB
        await db.update(blogPosts)
          .set({ status: 'published', publishedAt: new Date() })
          .where(eq(blogPosts.id, (postRecord as { id: string }).id));
      });

      return {
        status: 'published',
        postId: (postRecord as { id: string }).id,
        title: (postRecord as { id: string; title: string }).title,
        slug: (postRecord as { id: string; title: string; slug: string }).slug,
      };
    },
  );
}
