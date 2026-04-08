import { generateText } from "@/providers/generate-text.js";
import { db, schema } from "../../db/index.js";
import { eq, and } from "drizzle-orm";
import type {
  ChangeMatrixEntry,
  TransitionPlan,
  PerceptionMetrics,
  TrackingStatus,
  PositioningStepResult,
} from "./types.js";

const FLASH_MODEL = "gemini-2.5-flash";
const STRATEGIC_MODEL = "claude-sonnet-4-5";

// ── JSON parser ──

function parseJsonSafe<T>(text: string, fallback: T): T {
  try {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    return JSON.parse(fenceMatch ? fenceMatch[1].trim() : text.trim());
  } catch {
    return fallback;
  }
}

// ── 1. runCurrentAudit ──

export async function runCurrentAudit(
  clientId: string,
  input: {
    brandName: string;
    brandDna: unknown;
    listenerHistory: unknown;
    contentArtifacts: unknown;
  },
): Promise<PositioningStepResult> {
  const auditPrompt = `You are a brand positioning auditor. Analyze the following brand data and return a JSON object with:
- currentPositioning (string): concise summary of how the brand is currently positioned
- touchpointAudit (array of {touchpoint, currentMessage, effectiveness, notes}): audit of key brand touchpoints
- customerPerception (string): how customers currently perceive the brand
- strengthsToPreserve (string[]): brand strengths worth keeping in any repositioning
- weaknessesToAddress (string[]): positioning weaknesses that need to be corrected

Brand name: ${input.brandName}
Brand DNA: ${JSON.stringify(input.brandDna)}
Listener history: ${JSON.stringify(input.listenerHistory)}
Content artifacts: ${JSON.stringify(input.contentArtifacts)}

Respond ONLY with valid JSON. Mark all data as SYNTHETIC DATA.`;

  const raw = await generateText(
    FLASH_MODEL,
    "You are a brand positioning auditor. Output structured JSON only.",
    auditPrompt,
  );

  const fallback = {
    currentPositioning: "Unknown",
    touchpointAudit: [],
    customerPerception: "Not analyzed",
    strengthsToPreserve: [],
    weaknessesToAddress: [],
  };

  const data = parseJsonSafe(raw, fallback);

  const reportPrompt = `Write a comprehensive Current Brand Positioning Audit Report in Spanish (Latin American) for "${input.brandName}" based on this analysis:
${JSON.stringify(data)}

Include:
- Resumen ejecutivo del posicionamiento actual
- Auditoría de puntos de contacto
- Percepción del cliente
- Fortalezas a preservar
- Debilidades a abordar
- Recomendaciones preliminares

Mark as "DATOS SINTÉTICOS — sin monitoreo real activo".`;

  const artifactContent = await generateText(
    FLASH_MODEL,
    "Eres un consultor de posicionamiento de marca. Escribe en español latinoamericano.",
    reportPrompt,
  );

  return {
    step: "current_audit",
    status: "completed",
    data,
    artifactContent,
  };
}

// ── 2. defineTargetPositioning ──

export async function defineTargetPositioning(
  clientId: string,
  input: {
    currentAudit: unknown;
    competitiveLandscape: unknown;
    businessStrategy: unknown;
  },
): Promise<PositioningStepResult> {
  const targetPrompt = `You are a strategic brand positioning consultant. Based on the current audit, competitive landscape, and business strategy, define the target positioning and change matrix.

Return a JSON object with:
- targetPositioning (string): clear, differentiated target positioning statement
- changeMatrix (array of {element, current, target, changeType, phase}): where changeType is one of "replace"|"evolve"|"keep"|"remove"|"add", and phase is 1, 2, or 3
- preserveElements (string[]): brand elements that must remain unchanged

Current audit: ${JSON.stringify(input.currentAudit)}
Competitive landscape: ${JSON.stringify(input.competitiveLandscape)}
Business strategy: ${JSON.stringify(input.businessStrategy)}

Respond ONLY with valid JSON.`;

  const raw = await generateText(
    STRATEGIC_MODEL,
    "You are a strategic brand positioning consultant. Output structured JSON only.",
    targetPrompt,
  );

  const fallback: {
    targetPositioning: string;
    changeMatrix: ChangeMatrixEntry[];
    preserveElements: string[];
  } = {
    targetPositioning: "To be defined",
    changeMatrix: [],
    preserveElements: [],
  };

  const data = parseJsonSafe(raw, fallback);

  return {
    step: "target_definition",
    status: "completed",
    data,
  };
}

// ── 3. createTransitionPlan ──

export async function createTransitionPlan(
  clientId: string,
  input: {
    brandName: string;
    changeMatrix: ChangeMatrixEntry[];
    currentAssets: unknown;
  },
): Promise<PositioningStepResult> {
  const planPrompt = `You are a brand transition strategist. Create a detailed transition plan for repositioning "${input.brandName}".

Return a JSON object with:
- fromPositioning (string): current positioning summary
- toPositioning (string): target positioning summary
- phases (array of {phase, name, durationMonths, objectives[], actions[], measurements[]}): 3 phases of transition
- riskMitigation (string[]): key risks and how to mitigate them
- successMetrics (array of {metric, current, target}): measurable success indicators
- totalDurationMonths (number): total duration of the transition

Change matrix: ${JSON.stringify(input.changeMatrix)}
Current assets: ${JSON.stringify(input.currentAssets)}

Respond ONLY with valid JSON.`;

  const raw = await generateText(
    STRATEGIC_MODEL,
    "You are a brand transition strategist. Output structured JSON only.",
    planPrompt,
  );

  const fallbackData = {
    fromPositioning: "Current",
    toPositioning: "Target",
    phases: [],
    riskMitigation: [],
    successMetrics: [],
    totalDurationMonths: 12,
  };

  const parsedData = parseJsonSafe(raw, fallbackData);

  const data: TransitionPlan = {
    brandName: input.brandName,
    changeMatrix: input.changeMatrix,
    ...parsedData,
  };

  const reportPrompt = `Escribe un Plan de Transición de Posicionamiento de Marca completo en español latinoamericano para "${input.brandName}" basado en este plan:
${JSON.stringify(data)}

Incluye:
- Resumen ejecutivo
- Posicionamiento actual vs objetivo
- Matriz de cambios detallada
- Plan de fases (cronograma visual en texto)
- Mitigación de riesgos
- Métricas de éxito

Marca como "DATOS SINTÉTICOS — plan estratégico ilustrativo".`;

  const artifactContent = await generateText(
    STRATEGIC_MODEL,
    "Eres un estratega de transición de marca. Escribe en español latinoamericano.",
    reportPrompt,
  );

  return {
    step: "transition_plan",
    status: "completed",
    data,
    artifactContent,
  };
}

// ── 4. designPhases ──

export async function designPhases(
  clientId: string,
  input: {
    transitionPlan: TransitionPlan;
    channelSpecs: unknown;
  },
): Promise<PositioningStepResult> {
  const designPrompt = `You are a brand experience designer. Create detailed phase blueprints for executing this brand transition.

Return a JSON object with:
- phaseBlueprints (array of objects, one per transition phase):
  Each blueprint must include:
  - phase (number)
  - name (string)
  - touchpointChanges (array of {touchpoint, change, rationale})
  - messagingGuidance (string): key messages for this phase
  - visualEvolution (string): visual identity changes for this phase
  - internalTraining (string[]): internal alignment and training actions
  - productionBriefs (string[]): creative production deliverables needed

Transition plan: ${JSON.stringify(input.transitionPlan)}
Channel specs: ${JSON.stringify(input.channelSpecs)}

Respond ONLY with valid JSON.`;

  const raw = await generateText(
    FLASH_MODEL,
    "You are a brand experience designer. Output structured JSON only.",
    designPrompt,
  );

  const fallback = {
    phaseBlueprints: [],
  };

  const data = parseJsonSafe(raw, fallback);

  const reportPrompt = `Escribe un Diseño de Fases de Ejecución de Repositionamiento en español latinoamericano basado en estos blueprints:
${JSON.stringify(data)}

Incluye para cada fase:
- Descripción general
- Cambios en puntos de contacto
- Guía de mensajería
- Evolución visual
- Capacitación interna
- Briefs de producción

Marca como "DATOS SINTÉTICOS — diseño ilustrativo".`;

  const artifactContent = await generateText(
    FLASH_MODEL,
    "Eres un diseñador de experiencia de marca. Escribe en español latinoamericano.",
    reportPrompt,
  );

  return {
    step: "phase_design",
    status: "completed",
    data,
    artifactContent,
  };
}

// ── 5. recordPerceptionMeasurement ──

export async function recordPerceptionMeasurement(
  clientId: string,
  input: {
    repositioningProjectId: string;
    phase: number;
    metrics: PerceptionMetrics;
    status: TrackingStatus;
    notes?: string;
  },
): Promise<{ id: string }> {
  const [row] = await db
    .insert(schema.perceptionTracking)
    .values({
      clientId,
      repositioningProjectId: input.repositioningProjectId,
      phase: input.phase,
      measurementDate: new Date(),
      metrics: input.metrics,
      status: input.status,
      notes: input.notes ?? null,
    })
    .returning();

  return { id: row.id as string };
}

// ── 6. getPerceptionHistory ──

export async function getPerceptionHistory(
  clientId: string,
  projectId: string,
): Promise<unknown[]> {
  return await db
    .select()
    .from(schema.perceptionTracking)
    .where(
      and(
        eq(schema.perceptionTracking.clientId, clientId),
        eq(schema.perceptionTracking.repositioningProjectId, projectId),
      ),
    );
}
