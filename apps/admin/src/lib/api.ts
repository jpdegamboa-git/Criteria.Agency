/**
 * API client — typed helpers for the Hono backend.
 *
 * All calls go to /api/* which Next.js proxies to the Hono server.
 * Credentials are included so auth cookies flow automatically.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BrandHealthScore {
  id: string;
  organizationId: string;
  fundamentos: number | null;
  ejecucion: number | null;
  oportunidad: number | null;
  totalScore: number;
  calculatedAt: string;
}

export interface ThresholdAlert {
  id: string;
  organizationId: string;
  alertType: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  metric: string;
  status: 'open' | 'acknowledged' | 'resolved';
  deviationPct: number | null;
  message: string;
  createdAt: string;
}

export interface PromptRegistryEntry {
  id: string;
  agentId: string;
  skillId: string;
  version: number;
  systemPrompt: string;
  model: string;
  provider: string;
  dataSensitivity: 'A' | 'B' | 'C';
  approvedProviders: string[];
  active: boolean;
  updatedAt: string;
}

export interface MarketingPlan {
  id: string;
  organizationId: string;
  status: string;
  g3Status: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export interface CampaignBrief {
  id: string;
  organizationId: string;
  planId: string | null;
  name: string;
  concept: string;
  funnelStage: string;
  channelType: string;
  status: string;
  g6Status: string;
  g4Passed: boolean;
  createdAt: string;
}

export interface StrategicDiagnosis {
  id: string;
  organizationId: string;
  status: string;
  triggeredBy: string;
  iterationCount: number;
  createdAt: string;
}

export interface MotorExecution {
  id: string;
  organizationId: string;
  motor: string;
  status: string;
  triggeredBy: string;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const api = {
  // Analyst
  getBhs: (cookies?: string) =>
    apiFetch<{ score: BrandHealthScore | null } | BrandHealthScore>('/api/analyst/bhs', cookieHeader(cookies)),

  getAlerts: (cookies?: string) =>
    apiFetch<ThresholdAlert[]>('/api/analyst/alerts', cookieHeader(cookies)),

  getDashboard: (tenantId: string, cookies?: string) =>
    apiFetch<Record<string, unknown>>(`/api/analyst/dashboard?orgId=${tenantId}`, cookieHeader(cookies)),

  // Prompt Registry
  getPrompts: (cookies?: string) =>
    apiFetch<PromptRegistryEntry[]>('/api/prompts', cookieHeader(cookies)),

  updatePrompt: (id: string, data: Partial<PromptRegistryEntry>, cookies?: string) =>
    apiFetch<PromptRegistryEntry>(`/api/prompts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...cookieHeader(cookies),
    }),

  // Strategist
  getPlans: (status?: string, cookies?: string) =>
    apiFetch<MarketingPlan[]>(`/api/strategist/plans${status ? `?status=${status}` : ''}`, cookieHeader(cookies)),

  approvePlan: (id: string, notes?: string, cookies?: string) =>
    apiFetch<MarketingPlan>(`/api/strategist/plans/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
      ...cookieHeader(cookies),
    }),

  rejectPlan: (id: string, notes?: string, cookies?: string) =>
    apiFetch<MarketingPlan>(`/api/strategist/plans/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
      ...cookieHeader(cookies),
    }),

  getCampaigns: (status?: string, cookies?: string) =>
    apiFetch<CampaignBrief[]>(`/api/strategist/campaigns${status ? `?status=${status}` : ''}`, cookieHeader(cookies)),

  approveCampaign: (id: string, notes?: string, cookies?: string) =>
    apiFetch<CampaignBrief>(`/api/strategist/campaigns/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
      ...cookieHeader(cookies),
    }),

  rejectCampaign: (id: string, notes?: string, cookies?: string) =>
    apiFetch<CampaignBrief>(`/api/strategist/campaigns/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
      ...cookieHeader(cookies),
    }),

  getDiagnoses: (cookies?: string) =>
    apiFetch<StrategicDiagnosis[]>('/api/strategist/diagnoses', cookieHeader(cookies)),
};

function cookieHeader(cookies?: string): RequestInit {
  if (!cookies) return {};
  return { headers: { cookie: cookies } };
}
