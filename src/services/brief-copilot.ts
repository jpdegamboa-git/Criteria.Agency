import fs from "fs";
import path from "path";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { askClaude } from "./claude.js";
import { config } from "../shared/config.js";

// ── Types ──

interface CopilotClaude {
  reply: string;
  options: string[];
  extractedData: Record<string, unknown>;
  nextPhase: "understand" | "define" | "confirm" | null;
  readyForBrief: boolean;
  detectedProjectType: string | null;
}

interface GeneratedBrief {
  projectType: string;
  objective: string;
  audience: string;
  message: string;
  tone: string;
  duration: string;
  references: string;
  materials: string;
  additionalNotes: string;
}

export interface CopilotResponse {
  sessionId: string;
  reply: string;
  options: string[];
  phase: string;
  progress: number;
  brief: GeneratedBrief | null;
}

// ── Skill file (loaded once) ──

const skillPath = path.join(config.agentsPath, "CP-001_brief_copilot.md");
const SKILL_PROMPT = fs.readFileSync(skillPath, "utf-8");

// ── Helpers ──

function computeProgress(questionNum: number, briefDone: boolean): number {
  if (briefDone) return 1.0;
  return Math.min(questionNum / 7, 0.95);
}

function buildConversationHistory(
  answers: Record<string, unknown>
): string {
  const entries = Object.entries(answers);
  if (entries.length === 0) return "No previous conversation.";
  return entries
    .map(
      ([key, val]) =>
        `Q${key}: ${typeof val === "string" ? val : JSON.stringify(val)}`
    )
    .join("\n");
}

// ── Internal: generate structured brief ──

async function generateBrief(
  answers: Record<string, unknown>,
  projectType: string | null
): Promise<GeneratedBrief> {
  const system = `You are a creative brief structuring assistant for a video production agency. Given a set of conversation answers gathered from a client, produce a structured JSON brief. Respond ONLY with valid JSON, no extra text.`;

  const prompt = `Project type: ${projectType ?? "unknown"}

Conversation answers:
${JSON.stringify(answers, null, 2)}

Produce a JSON object with these exact keys:
{ "projectType", "objective", "audience", "message", "tone", "duration", "references", "materials", "additionalNotes" }

Fill each field with the best information extracted from the answers. Use empty string for missing data.`;

  const raw = await askClaude({
    system,
    prompt,
    model: "claude-sonnet-4-20250514",
    maxTokens: 1024,
  });

  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned) as GeneratedBrief;
  } catch {
    return {
      projectType: projectType ?? "unknown",
      objective: "",
      audience: "",
      message: "",
      tone: "",
      duration: "",
      references: "",
      materials: "",
      additionalNotes: "Brief generation failed to parse. Raw: " + raw.slice(0, 200),
    };
  }
}

// ── Public API ──

export async function startSession(
  clientId?: string
): Promise<CopilotResponse> {
  const [session] = await db
    .insert(schema.copilotSessions)
    .values({
      clientId: clientId ?? null,
      status: "active",
      currentPhase: "understand",
      currentQuestion: 1,
      answers: {},
    })
    .returning();

  return {
    sessionId: session.id,
    reply:
      "Hi! I'm your Brief Copilot. I'll help you shape your video project step by step. Let's start — what kind of project do you have in mind?",
    options: [
      "Corporate video",
      "Explainer / animated video",
      "Commercial / ad",
      "Documentary",
    ],
    phase: "understand",
    progress: 0,
    brief: null,
  };
}

export async function processMessage(
  sessionId: string,
  message: string
): Promise<CopilotResponse> {
  // Load session
  const [session] = await db
    .select()
    .from(schema.copilotSessions)
    .where(eq(schema.copilotSessions.id, sessionId));

  if (!session) {
    throw new Error(`Copilot session not found: ${sessionId}`);
  }

  if (session.status !== "active") {
    throw new Error(`Session is ${session.status}, cannot process messages.`);
  }

  const answers = (session.answers ?? {}) as Record<string, unknown>;
  const history = buildConversationHistory(answers);

  // Build prompt for Claude
  const conversationContext = `
SESSION STATE:
- Phase: ${session.currentPhase}
- Question number: ${session.currentQuestion}
- Project type detected: ${session.projectType ?? "not yet"}

CONVERSATION HISTORY:
${history}

CLIENT'S NEW MESSAGE:
"${message}"

Respond with the JSON format specified in the skill file.`;

  const raw = await askClaude({
    system: SKILL_PROMPT,
    prompt: conversationContext,
    model: "claude-sonnet-4-20250514",
    maxTokens: 1024,
  });

  // Parse Claude response
  let parsed: CopilotClaude;
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    parsed = JSON.parse(cleaned) as CopilotClaude;
  } catch {
    // Fallback if parsing fails
    parsed = {
      reply: raw || "I didn't quite catch that. Could you rephrase?",
      options: [],
      extractedData: {},
      nextPhase: null,
      readyForBrief: false,
      detectedProjectType: null,
    };
  }

  // Merge extracted data into answers
  const newAnswers = { ...answers };
  if (parsed.extractedData && Object.keys(parsed.extractedData).length > 0) {
    newAnswers[String(session.currentQuestion)] = {
      userMessage: message,
      ...parsed.extractedData,
    };
  } else {
    newAnswers[String(session.currentQuestion)] = message;
  }

  // Determine updates
  const nextPhase = parsed.nextPhase ?? session.currentPhase;
  const nextQuestion = session.currentQuestion + 1;
  const projectType =
    parsed.detectedProjectType ?? session.projectType ?? null;

  let brief: GeneratedBrief | null = null;
  let newStatus: "active" | "completed" | "abandoned" = "active";

  if (parsed.readyForBrief) {
    brief = await generateBrief(newAnswers, projectType);
    newStatus = "completed";
  }

  // Update session
  await db
    .update(schema.copilotSessions)
    .set({
      answers: newAnswers,
      currentPhase: nextPhase,
      currentQuestion: nextQuestion,
      projectType: projectType,
      generatedBrief: brief ? (brief as unknown as Record<string, unknown>) : undefined,
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(schema.copilotSessions.id, sessionId));

  return {
    sessionId,
    reply: parsed.reply,
    options: parsed.options ?? [],
    phase: nextPhase,
    progress: computeProgress(nextQuestion, parsed.readyForBrief),
    brief,
  };
}
