import { generateText } from "../../providers/generate-text.js";
import type {
  PerceptionMap,
  GapAnalysisResult,
  PositioningDocument,
  PositioningStepResult,
} from "./types.js";

const FLASH_MODEL = "gemini-2.5-flash";
const STRATEGIC_MODEL = "claude-sonnet-4-5";

// ── JSON parse helper ──

function parseJsonSafe<T>(text: string, fallback: T): T {
  try {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    return JSON.parse(fenceMatch ? fenceMatch[1].trim() : text.trim());
  } catch {
    return fallback;
  }
}

// ── 1. Perception Audit ──

export async function runPerceptionAudit(
  _clientId: string,
  input: {
    brandName: string;
    brandDna: unknown;
    listenerData: unknown;
  },
): Promise<PositioningStepResult> {
  const prompt = `Analyze the brand perception for "${input.brandName}" based on the following Brand DNA and listener data.

Brand DNA:
${JSON.stringify(input.brandDna, null, 2)}

Listener Data:
${JSON.stringify(input.listenerData, null, 2)}

Return a JSON object with the following structure (do NOT include brandName or generatedAt — those will be added separately):
{
  "attributes": [
    {
      "attribute": string,
      "currentPerception": string,
      "desiredPerception": string,
      "gap": "none" | "small" | "medium" | "large",
      "priority": "low" | "medium" | "high"
    }
  ],
  "strengths": string[],
  "weaknesses": string[],
  "keyAssociations": string[],
  "overallSentiment": number (0-100),
  "dataQuality": "high" | "medium" | "low"
}

Identify 4-6 key brand attributes. Be analytical and objective.
Respond ONLY with valid JSON (no markdown fences unless you must).`;

  const raw = await generateText(
    FLASH_MODEL,
    "You are a brand strategist specializing in perception analysis. Output structured JSON only.",
    prompt,
  );

  const fallback = {
    attributes: [],
    strengths: [],
    weaknesses: [],
    keyAssociations: [],
    overallSentiment: 50,
    dataQuality: "low" as const,
  };

  const parsed = parseJsonSafe<Omit<PerceptionMap, "brandName" | "generatedAt">>(raw, fallback);

  const perceptionMap: PerceptionMap = {
    brandName: input.brandName,
    ...parsed,
    generatedAt: new Date().toISOString(),
  };

  const reportPrompt = `Write a Perception Audit Report in Spanish (Latin American) based on this data:

${JSON.stringify(perceptionMap, null, 2)}

Include:
- Resumen ejecutivo del estado de percepción actual
- Tabla de atributos de marca (percepción actual vs. deseada)
- Fortalezas y debilidades clave
- Asociaciones de marca principales
- Puntuación de sentimiento general
- Recomendaciones estratégicas iniciales

Mark the report prominently as: "⚠️ DATOS SINTÉTICOS — sin monitoreo en tiempo real activo"`;

  const artifactContent = await generateText(
    FLASH_MODEL,
    "Eres un redactor de informes de marca. Escribe en español latinoamericano.",
    reportPrompt,
  );

  return {
    step: "perception_audit",
    status: "completed",
    data: perceptionMap,
    artifactContent,
  };
}

// ── 2. Gap Analysis ──

export async function runGapAnalysis(
  _clientId: string,
  input: {
    perceptionMap: PerceptionMap;
    brandDna: unknown;
    competitiveMap: unknown;
  },
): Promise<PositioningStepResult> {
  const prompt = `Perform a brand gap analysis comparing current perception vs. strategic aspirations.

Perception Map:
${JSON.stringify(input.perceptionMap, null, 2)}

Brand DNA (aspirational positioning):
${JSON.stringify(input.brandDna, null, 2)}

Competitive Map:
${JSON.stringify(input.competitiveMap, null, 2)}

Return a JSON object matching this structure exactly:
{
  "perceptionVsAspiration": [
    {
      "attribute": string,
      "currentPerception": string,
      "desiredPerception": string,
      "gap": "none" | "small" | "medium" | "large",
      "priority": "low" | "medium" | "high"
    }
  ],
  "priorityGaps": string[],
  "competitiveWhitespace": string[],
  "opportunities": string[],
  "risks": string[]
}

Be specific and actionable. Respond ONLY with valid JSON.`;

  const raw = await generateText(
    FLASH_MODEL,
    "You are a brand strategist specializing in competitive positioning and gap analysis. Output structured JSON only.",
    prompt,
  );

  const fallback: GapAnalysisResult = {
    perceptionVsAspiration: [],
    priorityGaps: [],
    competitiveWhitespace: [],
    opportunities: [],
    risks: [],
  };

  const parsed = parseJsonSafe<GapAnalysisResult>(raw, fallback);

  const reportPrompt = `Escribe un informe de Análisis de Brechas de Posicionamiento en español latinoamericano basado en estos datos:

${JSON.stringify(parsed, null, 2)}

Incluye:
- Resumen ejecutivo
- Análisis de brechas prioritarias (tabla comparativa)
- Espacios en blanco competitivos identificados
- Oportunidades estratégicas
- Riesgos a mitigar
- Próximos pasos recomendados

Marca el informe como: "⚠️ DATOS SINTÉTICOS — análisis generado por IA"`;

  const artifactContent = await generateText(
    FLASH_MODEL,
    "Eres un redactor de informes estratégicos de marca. Escribe en español latinoamericano.",
    reportPrompt,
  );

  return {
    step: "gap_analysis",
    status: "completed",
    data: parsed,
    artifactContent,
  };
}

// ── 3. Define Positioning ──

export async function definePositioning(
  _clientId: string,
  input: {
    gapAnalysis: GapAnalysisResult;
    brandDna: unknown;
    buyerPersonas: unknown;
  },
): Promise<PositioningStepResult> {
  const prompt = `You are a senior brand strategist. Based on the gap analysis, brand DNA, and buyer personas, define a comprehensive brand positioning document.

Gap Analysis:
${JSON.stringify(input.gapAnalysis, null, 2)}

Brand DNA:
${JSON.stringify(input.brandDna, null, 2)}

Buyer Personas:
${JSON.stringify(input.buyerPersonas, null, 2)}

Return a JSON object matching this structure exactly:
{
  "statement": {
    "targetAudience": string,
    "need": string,
    "brandName": string,
    "category": string,
    "keyBenefit": string,
    "reasonsToBelieve": string[]
  },
  "competitiveFrame": {
    "directCompetitors": [{ "name": string, "positioning": string }],
    "indirectCompetitors": [{ "name": string, "positioning": string }],
    "differentiation": string
  },
  "valueProposition": {
    "customerJobs": string[],
    "pains": string[],
    "gains": string[],
    "painRelievers": string[],
    "gainCreators": string[]
  },
  "perceptionGapMap": [
    {
      "attribute": string,
      "currentPerception": string,
      "desiredPerception": string,
      "gap": "none" | "small" | "medium" | "large",
      "priority": "low" | "medium" | "high"
    }
  ],
  "brandAttributes": [string, string, string],
  "audienceResonance": [
    { "audience": string, "fitScore": number, "reasoning": string }
  ],
  "confidenceScore": number (0-100),
  "validatedAt": null
}

Make it strategically rigorous and differentiated. Respond ONLY with valid JSON.`;

  const raw = await generateText(
    STRATEGIC_MODEL,
    "You are a world-class brand positioning strategist. Deliver strategic, differentiated, and actionable positioning frameworks. Output structured JSON only.",
    prompt,
  );

  const fallback: PositioningDocument = {
    statement: {
      targetAudience: "",
      need: "",
      brandName: "",
      category: "",
      keyBenefit: "",
      reasonsToBelieve: [],
    },
    competitiveFrame: {
      directCompetitors: [],
      indirectCompetitors: [],
      differentiation: "",
    },
    valueProposition: {
      customerJobs: [],
      pains: [],
      gains: [],
      painRelievers: [],
      gainCreators: [],
    },
    perceptionGapMap: [],
    brandAttributes: ["", "", ""],
    audienceResonance: [],
    confidenceScore: 0,
    validatedAt: null,
  };

  const parsed = parseJsonSafe<PositioningDocument>(raw, fallback);

  const reportPrompt = `Escribe un Documento de Posicionamiento de Marca completo en español latinoamericano basado en estos datos estratégicos:

${JSON.stringify(parsed, null, 2)}

Incluye:
- Declaración de posicionamiento (formato clásico: Para [audiencia], que necesita [necesidad], [marca] es el [categoría] que [beneficio clave]. A diferencia de [competencia], [marca] [diferenciador].)
- Marco competitivo
- Propuesta de valor (canvas)
- Atributos de marca core (3 pilares)
- Resonancia con audiencias objetivo
- Nivel de confianza estratégica

Marca el informe como: "⚠️ DATOS SINTÉTICOS — posicionamiento generado por IA, requiere validación"`;

  const artifactContent = await generateText(
    FLASH_MODEL,
    "Eres un redactor experto en estrategia de marca. Escribe en español latinoamericano.",
    reportPrompt,
  );

  return {
    step: "positioning_definition",
    status: "completed",
    data: parsed,
    artifactContent,
  };
}

// ── 4. Validate Positioning ──

export async function validatePositioning(
  _clientId: string,
  input: {
    positioning: PositioningDocument;
    brandDna: unknown;
  },
): Promise<PositioningStepResult> {
  const prompt = `Validate the following brand positioning document against strategic best practices and the brand's DNA.

Positioning Document:
${JSON.stringify(input.positioning, null, 2)}

Brand DNA:
${JSON.stringify(input.brandDna, null, 2)}

Evaluate on these dimensions and return a JSON object:
{
  "confidenceScore": number (0-100, overall validation confidence),
  "dimensions": {
    "clarity": { "score": number (0-100), "feedback": string },
    "differentiation": { "score": number (0-100), "feedback": string },
    "relevance": { "score": number (0-100), "feedback": string },
    "credibility": { "score": number (0-100), "feedback": string },
    "consistency": { "score": number (0-100), "feedback": string }
  },
  "strengths": string[],
  "weaknesses": string[],
  "recommendations": string[],
  "isValid": boolean,
  "validatedAt": string (ISO 8601)
}

Be rigorous and honest. Respond ONLY with valid JSON.`;

  const raw = await generateText(
    FLASH_MODEL,
    "You are a brand positioning validator. Critically assess positioning documents against strategic criteria. Output structured JSON only.",
    prompt,
  );

  const fallback = {
    confidenceScore: 0,
    dimensions: {
      clarity: { score: 0, feedback: "" },
      differentiation: { score: 0, feedback: "" },
      relevance: { score: 0, feedback: "" },
      credibility: { score: 0, feedback: "" },
      consistency: { score: 0, feedback: "" },
    },
    strengths: [],
    weaknesses: [],
    recommendations: [],
    isValid: false,
    validatedAt: new Date().toISOString(),
  };

  const parsed = parseJsonSafe<typeof fallback>(raw, fallback);

  return {
    step: "validation",
    status: "completed",
    data: parsed,
  };
}
