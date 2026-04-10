/**
 * API client — typed helpers for the client portal.
 *
 * All calls go to /api/* which Next.js proxies to the Hono server.
 * Credentials are included so auth cookies flow automatically.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
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

export interface Campaign {
  id: string;
  organizationId: string;
  name: string;
  funnelStage: 'awareness' | 'consideration' | 'conversion' | 'retention';
  channelType: 'paid' | 'owned' | 'earned';
  status: 'definition' | 'production' | 'execution' | 'completed' | 'paused';
  objectives: Record<string, unknown>;
  budget: string | null;
  budgetSpent: string | null;
  startDate: string | null;
  endDate: string | null;
  campaignScore: number | null;
  createdAt: string;
}

export interface BrandHealthScore {
  id: string;
  fundamentos: number | null;
  ejecucion: number | null;
  oportunidad: number | null;
  totalScore: number;
  breakdown: Record<string, unknown>;
  calculatedAt: string;
}

export interface BrandDna {
  id: string;
  organizationId: string;
  currentLayer: number;
  onboardingPath: string | null;
  status: string;
  fundamentos_score: number;
  createdAt: string;
  updatedAt: string;
}

export interface BrandDnaArtifact {
  id: string;
  layer: number;
  artifactType: string;
  status: string;
  content: Record<string, unknown>;
  createdAt: string;
}

export interface MaraSession {
  id: string;
  status: string;
  invocationsUsed: number;
  summary: string | null;
  startedAt: string;
}

export interface MaraMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  intentCategory: string | null;
  tokensConsumed: number;
  createdAt: string;
}

export interface PlayPauseState {
  playMode: boolean;
  invocationsThisPeriod: number;
  sessionBudget: number;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const api = {
  // Campaigns
  getCampaigns: (cookies?: string) =>
    apiFetch<Campaign[]>('/api/analyst/campaigns', cookieHeader(cookies)),

  // Brand Health Score
  getBhs: (cookies?: string) =>
    apiFetch<{ score: BrandHealthScore | null }>('/api/analyst/bhs', cookieHeader(cookies)),

  getBhsHistory: (cookies?: string) =>
    apiFetch<BrandHealthScore[]>('/api/analyst/bhs/history', cookieHeader(cookies)),

  // Brand DNA
  getBrandDna: (cookies?: string) =>
    apiFetch<{ brandDna: BrandDna | null; artifacts: BrandDnaArtifact[] }>(
      '/api/brand-builder/dna',
      cookieHeader(cookies),
    ),

  // MARA
  startMaraSession: (uiContext?: Record<string, unknown>, cookies?: string) =>
    apiFetch<{ session: MaraSession; resumed: boolean; openingMessage?: string }>(
      '/api/mara/session',
      { method: 'POST', body: JSON.stringify({ uiContext }), ...cookieHeader(cookies) },
    ),

  endMaraSession: (sessionId: string, cookies?: string) =>
    apiFetch<{ queued: boolean }>(`/api/mara/session/${sessionId}`, {
      method: 'DELETE',
      ...cookieHeader(cookies),
    }),

  getMaraSessionMessages: (sessionId: string, cookies?: string) =>
    apiFetch<{ messages: MaraMessage[]; playPauseState: PlayPauseState }>(
      `/api/mara/session/${sessionId}`,
      cookieHeader(cookies),
    ),

  sendMaraMessage: (
    sessionId: string,
    message: string,
    uiContext?: Record<string, unknown>,
    cookies?: string,
  ) =>
    apiFetch<{ response: string; intent: { category: string }; blocked?: boolean }>(
      '/api/mara/chat',
      {
        method: 'POST',
        body: JSON.stringify({ sessionId, message, uiContext }),
        ...cookieHeader(cookies),
      },
    ),

  getPlayPause: (cookies?: string) =>
    apiFetch<PlayPauseState>('/api/mara/play-pause', cookieHeader(cookies)),

  togglePlayPause: (playMode: boolean, cookies?: string) =>
    apiFetch<PlayPauseState>('/api/mara/play-pause', {
      method: 'PUT',
      body: JSON.stringify({ playMode }),
      ...cookieHeader(cookies),
    }),
};

function cookieHeader(cookies?: string): RequestInit {
  if (!cookies) return {};
  return { headers: { cookie: cookies } };
}
