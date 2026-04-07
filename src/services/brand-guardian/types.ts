// ── Brand Guardian Types ──

export interface BrandDimensionIssue {
  description: string;
  severity: "critical" | "major" | "minor";
  suggestion: string;
  reference: string;
}

export interface BrandDimensionResult {
  name: string;
  score: number;
  status: "pass" | "warning" | "fail";
  issues: BrandDimensionIssue[];
}

export interface BrandValidation {
  overallScore: number;
  verdict: "pass" | "needs_revision" | "fail";
  dimensions: BrandDimensionResult[];
  summary: string;
  autoFixable: boolean;
  autoFixSuggestions: string[];
}

export interface BrandRule {
  id: string;
  clientId: string;
  dimension: string;
  type: "always" | "never" | "prefer" | "avoid";
  rule: string;
  source: "brand_dna" | "human_feedback" | "learned";
  examples: Array<{ correct: string; incorrect: string }>;
  confidence: number;
  enabled: boolean;
}

export interface BrandGuardianConfig {
  clientId: string;
  passThreshold: number;
  autoPassThreshold: number;
  strictMode: boolean;
  weightsByDimension: Record<string, number>;
}

export interface BrandManualSection {
  title: string;
  content: string;
}

export interface ValidateContentInput {
  content: string;
  contentType: string;
  projectId?: string;
  brandDna?: string;
}

export interface VerbalValidationInput {
  content: string;
  brandDna: string;
  rules: BrandRule[];
}

export interface VisualValidationInput {
  content: string;
  brandDna: string;
  rules: BrandRule[];
}

export const DEFAULT_DIMENSION_WEIGHTS: Record<string, number> = {
  tone: 15,
  vocabulary: 10,
  key_messages: 15,
  audience_fit: 15,
  visual_palette: 15,
  typography: 10,
  imagery_style: 10,
  logo_usage: 10,
};

export const VERBAL_DIMENSIONS = ["tone", "vocabulary", "key_messages", "audience_fit"] as const;
export const VISUAL_DIMENSIONS = ["visual_palette", "typography", "imagery_style", "logo_usage"] as const;
