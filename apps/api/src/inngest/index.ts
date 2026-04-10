/**
 * Inngest barrel export — Step 0.6 / Step 0.9 / Phase 1 / Phase 2 / Phase 3
 *
 * Exports the client and all function creators.
 * Each motor adds its functions here as they're built.
 */
export { inngest } from './client.js';
export { createTestHelloWorldFn } from './functions/test-hello-world.js';
export { createE2eLoopFn } from './functions/e2e-loop.js';

// Brand Builder motor (Phase 1)
export { createLayer0OnboardingFn } from './functions/brand-builder/layer-0-onboarding.js';
export { createLayer1DiscoveryFn } from './functions/brand-builder/layer-1-discovery.js';
export { createLayer2StrategicDepthFn } from './functions/brand-builder/layer-2-strategic-depth.js';
export { createLayer3IdentitySystemsFn } from './functions/brand-builder/layer-3-identity-systems.js';

// Video Motor (legacy prototype)
export { createVideoMotorPipelineFn } from './functions/video-motor/pipeline.js';

// Web Motor (Fase 2 — DEC-222)
export { createWebMotorPipelineFn } from './functions/web-motor/pipeline.js';
export { createWebMotorBlogPostFn } from './functions/web-motor/blog-post.js';

// Analyst System Functions (Phase 3)
export { createBhsDailyFn } from './functions/analyst/bhs-daily.js';
export { createThresholdCheckFn } from './functions/analyst/threshold-check.js';

// Strategist Motor (Phase 4)
export { createStrategistDiagnosticFn } from './functions/strategist/diagnostic.js';
export { createStrategistPlanningFn } from './functions/strategist/planning.js';
export { createStrategistCampaignDesignFn } from './functions/strategist/campaign-design.js';

// MARA — Conversational Interface Agent (Fase 6)
export { createMaraSessionSummaryFn } from './functions/mara/session-summary.js';
