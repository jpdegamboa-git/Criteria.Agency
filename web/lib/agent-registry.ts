/**
 * Lightweight agent registry for frontend display.
 * Keep in sync with src/agents/registry.ts.
 */

export interface AgentInfo {
  id: string;
  name: string;
  team: number;
  teamName: string;
  level: string;
  steps: string[];
  gates: string[];
  autonomy: number;
}

export const TEAM_NAMES: Record<number, string> = {
  0: "Leadership",
  1: "Creative Development",
  2: "Writers Room",
  3: "Cinematography",
  5: "Audio",
  6: "Post-Production",
  7: "Client Experience",
  9: "AI Model Intelligence",
  10: "Brand Builder",
  11: "Strategist",
  12: "Intelligence",
  13: "Transversals",
};

export const AGENTS: AgentInfo[] = [
  { id: "TL-001", name: "Project Manager", team: 0, teamName: "Leadership", level: "top", steps: [], gates: [], autonomy: 90 },
  { id: "TL-002", name: "Showrunner", team: 0, teamName: "Leadership", level: "top", steps: [], gates: ["g1","g2","g3","g4","g5"], autonomy: 90 },
  { id: "TL-003", name: "Producer", team: 0, teamName: "Leadership", level: "top", steps: ["visual_look"], gates: [], autonomy: 85 },
  { id: "T1-L", name: "Creative Director", team: 1, teamName: "Creative Development", level: "leader", steps: ["brief","concept"], gates: ["g2"], autonomy: 85 },
  { id: "T2-L", name: "Head Writer", team: 2, teamName: "Writers Room", level: "leader", steps: ["script"], gates: [], autonomy: 80 },
  { id: "T2-002", name: "AV Copywriter", team: 2, teamName: "Writers Room", level: "sub", steps: ["script"], gates: [], autonomy: 80 },
  { id: "T2-006", name: "Script Doctor", team: 2, teamName: "Writers Room", level: "sub", steps: ["script"], gates: [], autonomy: 80 },
  { id: "T3-L", name: "Director of Photography", team: 3, teamName: "Cinematography", level: "leader", steps: ["visual_look","storyboard"], gates: [], autonomy: 75 },
  { id: "T3-003", name: "Cinematic Prompt Engineer", team: 3, teamName: "Cinematography", level: "sub", steps: ["storyboard","video_gen"], gates: [], autonomy: 75 },
  { id: "T5-L", name: "Sonorizador", team: 5, teamName: "Audio", level: "leader", steps: ["audio"], gates: [], autonomy: 70 },
  { id: "T6-L", name: "Editor", team: 6, teamName: "Post-Production", level: "leader", steps: ["edit","polish"], gates: [], autonomy: 65 },
  { id: "T6-003", name: "Delivery Master", team: 6, teamName: "Post-Production", level: "sub", steps: ["delivery"], gates: [], autonomy: 90 },
  { id: "T7-L", name: "Client Service", team: 7, teamName: "Client Experience", level: "leader", steps: ["brief","delivery"], gates: [], autonomy: 85 },
  { id: "XF-001", name: "Cinematographic Critic", team: 0, teamName: "Cross-Functional", level: "cross_functional", steps: [], gates: ["g4","g5"], autonomy: 100 },
  { id: "T9-L", name: "AI Model Director", team: 9, teamName: "AI Model Intelligence", level: "leader", steps: ["model_config"], gates: [], autonomy: 80 },
  { id: "T9-001", name: "Text Model Specialist", team: 9, teamName: "AI Model Intelligence", level: "sub", steps: [], gates: [], autonomy: 80 },
  { id: "T9-002", name: "Image Model Specialist", team: 9, teamName: "AI Model Intelligence", level: "sub", steps: [], gates: [], autonomy: 80 },
  { id: "T9-003", name: "Video Model Specialist", team: 9, teamName: "AI Model Intelligence", level: "sub", steps: [], gates: [], autonomy: 80 },
  { id: "T9-004", name: "Audio Model Specialist", team: 9, teamName: "AI Model Intelligence", level: "sub", steps: [], gates: [], autonomy: 80 },
  { id: "T9-005", name: "Model Benchmarker", team: 9, teamName: "AI Model Intelligence", level: "sub", steps: [], gates: [], autonomy: 80 },
  // Brand Builder
  { id: "BB-L", name: "Brand Architect", team: 10, teamName: "Brand Builder", level: "leader", steps: ["discovery","positioning","brand_dna"], gates: ["bb-g1","bb-g2"], autonomy: 75 },
  { id: "BB-001", name: "Workshop Facilitator", team: 10, teamName: "Brand Builder", level: "sub", steps: ["discovery"], gates: [], autonomy: 80 },
  { id: "BB-002", name: "Sociologist", team: 10, teamName: "Brand Builder", level: "sub", steps: ["research"], gates: [], autonomy: 85 },
  { id: "BB-003", name: "Verbal Identity Designer", team: 10, teamName: "Brand Builder", level: "sub", steps: ["identity"], gates: [], autonomy: 70 },
  { id: "BB-004", name: "Visual Identity Advisor", team: 10, teamName: "Brand Builder", level: "sub", steps: ["identity"], gates: [], autonomy: 70 },
  // Strategist
  { id: "ST-L", name: "Chief Strategist", team: 11, teamName: "Strategist", level: "leader", steps: ["diagnostic","objectives","value_prop","briefs"], gates: ["st-g1","st-g2"], autonomy: 75 },
  { id: "ST-001", name: "Audience Analyst", team: 11, teamName: "Strategist", level: "sub", steps: ["audiences"], gates: [], autonomy: 80 },
  { id: "ST-002", name: "Media Planner", team: 11, teamName: "Strategist", level: "sub", steps: ["media_plan"], gates: [], autonomy: 75 },
  { id: "ST-003", name: "Budget Allocator", team: 11, teamName: "Strategist", level: "sub", steps: ["budget"], gates: [], autonomy: 80 },
  // Intelligence (Listeners)
  { id: "LI-001", name: "Brand Listener", team: 12, teamName: "Intelligence", level: "sub", steps: ["diagnostic"], gates: [], autonomy: 90 },
  { id: "LI-002", name: "Culture Listener", team: 12, teamName: "Intelligence", level: "sub", steps: ["research","diagnostic","audiences"], gates: [], autonomy: 90 },
  { id: "LI-003", name: "Industry Listener", team: 12, teamName: "Intelligence", level: "sub", steps: ["diagnostic"], gates: [], autonomy: 90 },
  { id: "LI-004", name: "Competitive Listener", team: 12, teamName: "Intelligence", level: "sub", steps: ["research","diagnostic","value_prop"], gates: [], autonomy: 90 },
  // Transversals
  { id: "XA-001", name: "Financial Agent", team: 13, teamName: "Transversals", level: "cross_functional", steps: ["budget"], gates: ["st-g1"], autonomy: 85 },
  { id: "XA-002", name: "Channel Manager", team: 13, teamName: "Transversals", level: "cross_functional", steps: ["media_plan"], gates: [], autonomy: 85 },
  { id: "XA-003", name: "Brand Guardian", team: 13, teamName: "Transversals", level: "cross_functional", steps: [], gates: ["bb-g2","st-g2"], autonomy: 80 },
  { id: "XA-004", name: "Media Scout", team: 13, teamName: "Transversals", level: "cross_functional", steps: ["media_plan"], gates: [], autonomy: 85 },
];

export function getAgent(id: string): AgentInfo | undefined {
  return AGENTS.find((a) => a.id === id);
}
