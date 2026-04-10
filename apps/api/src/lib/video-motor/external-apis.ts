/**
 * External API interfaces for Video Motor — Fase 2
 *
 * All external generation APIs are abstracted behind interfaces to enable:
 * 1. Provider swapping without pipeline changes
 * 2. Stub implementations for Fase 2 validation (pipeline flow, not visual quality)
 * 3. Real implementations added incrementally
 *
 * Per BUILD_ORDER §Fase 2: "Start with mock/stub implementations to validate the
 * pipeline flow, then swap in real APIs."
 *
 * External APIs used in Video Motor:
 * - Image generation: Flux / Midjourney (storyboard step)
 * - Video generation: Runway / Kling / Sora / Veo (video_gen step)
 * - Voice/TTS: ElevenLabs (audio step)
 * - Music: Suno / Udio / royalty-free library (audio step)
 * - Video delivery: Bunny Stream (delivery step)
 */

// ── Image Generator ───────────────────────────────────────────────────────────

export interface ImageGenerationRequest {
  prompt: string;
  /** Width x Height in pixels */
  dimensions?: { width: number; height: number };
  /** Style guidance for the image */
  style?: string;
  /** Aspect ratio for the shot */
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3';
  /** Reference image URL for style consistency */
  referenceUrl?: string;
}

export interface ImageGenerationResult {
  /** URL or R2 key of the generated image */
  imageUrl: string;
  /** Estimated cost in USD */
  estimatedCost: number;
  /** Provider used */
  provider: string;
  /** Whether this is a stub result */
  isStub: boolean;
}

export interface ImageGenerator {
  generate(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
}

/** Stub image generator — returns placeholder data for pipeline validation */
export class StubImageGenerator implements ImageGenerator {
  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    // Simulate slight delay like a real API
    await new Promise((r) => setTimeout(r, 50));
    return {
      imageUrl: `stub://image/${Date.now()}-${encodeURIComponent(request.prompt.slice(0, 30))}`,
      estimatedCost: 0.02,
      provider: 'stub',
      isStub: true,
    };
  }
}

// ── Video Generator ───────────────────────────────────────────────────────────

export interface VideoGenerationRequest {
  /** Optimized prompt from DP + Video Generation Prompting skill */
  prompt: string;
  /** Duration of the clip in seconds */
  durationSeconds: number;
  /** Reference image for the first frame */
  referenceImageUrl?: string;
  /** Camera movement instruction */
  cameraMovement?: string;
  /** Visual style consistent with creative direction */
  style?: string;
  /** Shot index for logging/versioning */
  shotIndex: number;
}

export interface VideoGenerationResult {
  /** URL or R2 key of the generated video clip */
  clipUrl: string;
  durationSeconds: number;
  /** Estimated cost in USD */
  estimatedCost: number;
  provider: string;
  isStub: boolean;
}

export interface VideoGenerator {
  generateClip(request: VideoGenerationRequest): Promise<VideoGenerationResult>;
}

/** Stub video generator — returns placeholder data for pipeline validation */
export class StubVideoGenerator implements VideoGenerator {
  async generateClip(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    await new Promise((r) => setTimeout(r, 100));
    return {
      clipUrl: `stub://video/shot-${request.shotIndex}-${Date.now()}`,
      durationSeconds: request.durationSeconds,
      estimatedCost: 0.50,
      provider: 'stub',
      isStub: true,
    };
  }
}

// ── Voice / TTS Generator ─────────────────────────────────────────────────────

export interface VoiceGenerationRequest {
  /** Script text to convert to speech */
  text: string;
  /** Voice ID (from ElevenLabs or equivalent) */
  voiceId?: string;
  /** Pace: 0.5 = slow, 1.0 = normal, 1.5 = fast */
  pace?: number;
  /** Emotional direction from Creative Direction audio section */
  emotion?: string;
  /** Stability (0-1): lower = more expressive */
  stability?: number;
}

export interface VoiceGenerationResult {
  audioUrl: string;
  durationSeconds: number;
  estimatedCost: number;
  provider: string;
  isStub: boolean;
}

export interface VoiceGenerator {
  generate(request: VoiceGenerationRequest): Promise<VoiceGenerationResult>;
}

/** Stub voice generator */
export class StubVoiceGenerator implements VoiceGenerator {
  async generate(request: VoiceGenerationRequest): Promise<VoiceGenerationResult> {
    await new Promise((r) => setTimeout(r, 50));
    const wordCount = request.text.split(' ').length;
    const durationSeconds = Math.round(wordCount / 2.5); // ~150 WPM
    return {
      audioUrl: `stub://audio/vo-${Date.now()}`,
      durationSeconds,
      estimatedCost: 0.003 * wordCount,
      provider: 'stub',
      isStub: true,
    };
  }
}

// ── Music Generator ───────────────────────────────────────────────────────────

export interface MusicGenerationRequest {
  /** Music direction from Creative Direction audio section */
  moodDescription: string;
  /** Target duration in seconds */
  durationSeconds: number;
  /** BPM hint */
  bpm?: number;
  /** Musical genre or style */
  genre?: string;
  /** Whether to include vocals */
  includeVocals?: boolean;
}

export interface MusicGenerationResult {
  audioUrl: string;
  durationSeconds: number;
  estimatedCost: number;
  provider: string;
  isStub: boolean;
}

export interface MusicGenerator {
  generate(request: MusicGenerationRequest): Promise<MusicGenerationResult>;
}

/** Stub music generator */
export class StubMusicGenerator implements MusicGenerator {
  async generate(request: MusicGenerationRequest): Promise<MusicGenerationResult> {
    await new Promise((r) => setTimeout(r, 50));
    return {
      audioUrl: `stub://audio/music-${Date.now()}`,
      durationSeconds: request.durationSeconds,
      estimatedCost: 0.10,
      provider: 'stub',
      isStub: true,
    };
  }
}

// ── Factory — create stub implementations for Fase 2 ─────────────────────────

export interface ExternalAPIs {
  image: ImageGenerator;
  video: VideoGenerator;
  voice: VoiceGenerator;
  music: MusicGenerator;
}

/**
 * Creates stub implementations for Fase 2 pipeline validation.
 * Replace with real implementations as API integrations are added.
 */
export function createStubExternalAPIs(): ExternalAPIs {
  return {
    image: new StubImageGenerator(),
    video: new StubVideoGenerator(),
    voice: new StubVoiceGenerator(),
    music: new StubMusicGenerator(),
  };
}
