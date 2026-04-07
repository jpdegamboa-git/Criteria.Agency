// src/orchestrator/pipeline-registry.ts

export interface GateConfig {
  afterStep: string;
  evaluators: string[];
  maxIterations: number;
  failReturnTo: string;
}

export interface PipelineDefinition {
  type: string;
  steps: string[];
  stepAgents: Record<string, string[]>;
  gates: Record<string, GateConfig>;
}

const registry = new Map<string, PipelineDefinition>();

export const PipelineRegistry = {
  register(pipeline: PipelineDefinition): void {
    registry.set(pipeline.type, pipeline);
  },

  get(type: string): PipelineDefinition {
    const pipeline = registry.get(type);
    if (!pipeline) {
      throw new Error(`Unknown pipeline type: ${type}`);
    }
    return pipeline;
  },

  getSteps(type: string): string[] {
    return this.get(type).steps;
  },

  getAgentsForStep(type: string, step: string): string[] {
    return this.get(type).stepAgents[step] ?? [];
  },

  getGateAfterStep(type: string, step: string): string | undefined {
    const pipeline = this.get(type);
    for (const [gateName, config] of Object.entries(pipeline.gates)) {
      if (config.afterStep === step) return gateName;
    }
    return undefined;
  },

  getGateConfig(type: string, gate: string): GateConfig {
    const config = this.get(type).gates[gate];
    if (!config) {
      throw new Error(`Unknown gate ${gate} in pipeline ${type}`);
    }
    return config;
  },

  getNextStep(type: string, currentStep: string): string | null {
    const steps = this.getSteps(type);
    const idx = steps.indexOf(currentStep);
    if (idx === -1 || idx >= steps.length - 1) return null;
    return steps[idx + 1];
  },

  has(type: string): boolean {
    return registry.has(type);
  },
};

// ── Video Production Pipeline (extracted from current hardcoded values) ──

PipelineRegistry.register({
  type: "video-production",
  steps: [
    "brief", "concept", "script", "visual_look", "storyboard",
    "video_gen", "edit", "audio", "polish", "delivered",
  ],
  stepAgents: {
    brief: ["T7-L", "T1-L"],
    concept: ["T1-L"],
    script: ["T2-L", "T2-002", "T2-006"],
    visual_look: ["T3-L", "TL-003"],
    storyboard: ["T3-L", "T3-003"],
    video_gen: ["T3-003"],
    edit: ["T6-L"],
    audio: ["T5-L"],
    polish: ["T6-L"],
    delivery: ["T6-003", "T7-L"],
  },
  gates: {
    g1: { afterStep: "concept", evaluators: ["TL-002"], maxIterations: 3, failReturnTo: "concept" },
    g2: { afterStep: "script", evaluators: ["TL-002", "T1-L"], maxIterations: 3, failReturnTo: "script" },
    g3: { afterStep: "storyboard", evaluators: ["TL-002"], maxIterations: 2, failReturnTo: "storyboard" },
    g4: { afterStep: "audio", evaluators: ["TL-002", "XF-001"], maxIterations: 2, failReturnTo: "edit" },
    g5: { afterStep: "polish", evaluators: ["TL-002", "XF-001"], maxIterations: 1, failReturnTo: "polish" },
  },
});

// ── Brand Builder Pipeline ──

PipelineRegistry.register({
  type: "brand-builder",
  steps: ["discovery", "research", "positioning", "identity", "brand_dna"],
  stepAgents: {
    discovery: ["BB-L", "BB-001"],
    research: ["BB-002", "LI-002", "LI-004"],
    positioning: ["BB-L"],
    identity: ["BB-003", "BB-004"],
    brand_dna: ["BB-L"],
  },
  gates: {
    "bb-g1": { afterStep: "research", evaluators: ["BB-L"], maxIterations: 3, failReturnTo: "research" },
    "bb-g2": { afterStep: "identity", evaluators: ["BB-L", "XA-003"], maxIterations: 3, failReturnTo: "identity" },
    "bb-g3": { afterStep: "brand_dna", evaluators: ["human"], maxIterations: 1, failReturnTo: "brand_dna" },
  },
});

// ── Strategist Pipeline ──

PipelineRegistry.register({
  type: "strategist",
  steps: ["diagnostic", "objectives", "audiences", "value_prop", "media_plan", "budget", "briefs"],
  stepAgents: {
    diagnostic: ["ST-L", "LI-001", "LI-002", "LI-003", "LI-004"],
    objectives: ["ST-L"],
    audiences: ["ST-001", "LI-002"],
    value_prop: ["ST-L", "LI-004"],
    media_plan: ["ST-002", "XA-002", "XA-004"],
    budget: ["ST-003", "XA-001"],
    briefs: ["ST-L"],
  },
  gates: {
    "st-g1": { afterStep: "objectives", evaluators: ["ST-L", "XA-001"], maxIterations: 3, failReturnTo: "objectives" },
    "st-g2": { afterStep: "value_prop", evaluators: ["ST-L", "XA-003"], maxIterations: 3, failReturnTo: "value_prop" },
    "st-g3": { afterStep: "budget", evaluators: ["human"], maxIterations: 1, failReturnTo: "budget" },
  },
});

// ── Graphic Design Pipeline ──

PipelineRegistry.register({
  type: "graphic-design",
  steps: [
    "brief", "design_system", "moodboard", "production", "adaptation", "delivery",
  ],
  stepAgents: {
    brief: ["GD-L"],
    design_system: ["GD-L", "GD-001"],
    moodboard: ["GD-L", "GD-002"],
    production: ["GD-L", "GD-002", "GD-004", "GD-005", "CW-001"],
    adaptation: ["GD-003", "GD-004"],
    delivery: ["GD-003"],
  },
  gates: {
    "gd-g1": {
      afterStep: "moodboard",
      evaluators: ["GD-L", "XA-003"],
      maxIterations: 3,
      failReturnTo: "moodboard",
    },
    "gd-g2": {
      afterStep: "production",
      evaluators: ["GD-L", "TL-002", "XA-003"],
      maxIterations: 3,
      failReturnTo: "production",
    },
    "gd-g3": {
      afterStep: "delivery",
      evaluators: ["GD-L"],
      maxIterations: 1,
      failReturnTo: "adaptation",
    },
  },
});
