# Audio Specs — Audio Pipeline Directive

Technical specifications and quality standards for all audio assets produced in the Audio pipeline.

---

## Channel Loudness Standards

| Channel | Sample Rate | Bit Depth | Format | Target Loudness | True Peak |
|---------|-------------|-----------|--------|----------------|-----------|
| Broadcast (TV/Radio) | 48 kHz | 24-bit | WAV | -24 LUFS | -2 dBTP |
| Streaming (Spotify/Apple) | 44.1 kHz | 16-bit | MP3 (320 kbps) | -14 LUFS | -1 dBTP |
| Web (HTML5 / OTT) | 48 kHz | 16-bit | AAC (256 kbps) | -16 LUFS | -1 dBTP |
| Social (IG Reels / TikTok / YouTube) | 44.1 kHz | 16-bit | AAC / MP3 | -14 LUFS | -1 dBTP |
| Event / Live Playback | 48 kHz | 24-bit | WAV | -20 LUFS | -3 dBTP |

> Measurements use integrated LUFS (full file), not momentary. Use EBU R128 / ITU-R BS.1770-4 compliant meters.

---

## SFX Categories

| Category | Description | Usage |
|----------|-------------|-------|
| **hits** | Impactful single-frame percussive sounds | Logo stings, emphasis moments, cut points |
| **whooshes** | Swipe / sweep transitions | Scene changes, element entries/exits |
| **transitions** | Rise, fall, and swell connectors | Section breaks, narrative bridges |
| **ambience** | Continuous environmental layers | Scene-setting, background texture |
| **ui** | Click, tap, notification, error, success tones | Product demos, app walkthroughs |
| **foley** | Everyday physical sounds (footsteps, fabric, props) | Narrative realism |
| **musical** | Melodic accents, stabs, beds, and motifs | Brand moments, emotional underscoring |

All SFX must be royalty-free, cleared for commercial use, or original. Document license for every third-party sound.

---

## Delivery Formats

| Deliverable | Format | Sample Rate | Bit Depth | Notes |
|-------------|--------|-------------|-----------|-------|
| Master (archive) | WAV | 48 kHz | 24-bit | Uncompressed, no limiting |
| Broadcast master | WAV | 48 kHz | 24-bit | Loudness-normalized per channel |
| Streaming export | MP3 | 44.1 kHz | 16-bit | 320 kbps CBR |
| Web export | AAC | 48 kHz | 16-bit | 256 kbps |
| Social export | AAC | 44.1 kHz | 16-bit | 256 kbps, stereo |
| Stems | WAV | 48 kHz | 24-bit | Music / VO / SFX separate |
| Preview / review | MP3 | 44.1 kHz | 16-bit | 192 kbps, watermarked |

---

## Quality Standards

All audio deliverables must pass the following checks before handoff:

1. **No clipping.** True peak must not exceed the channel-specific dBTP limit. Verify with a true-peak limiter, not just peak meters.
2. **No artifacts.** Zero digital distortion, clicks, pops, dropouts, encoding artifacts, or aliasing.
3. **Proper fades.** All file starts and ends must have a clean fade-in/out (minimum 10 ms) to prevent click noise on playback start.
4. **Silence trimmed.** Leading silence: ≤200 ms. Trailing silence: ≤500 ms (unless intentional pause is part of the creative).
5. **Stereo integrity.** Mono-compatible mix: sum to mono and verify no phase cancellation on key elements (kick, bass, VO).
6. **Consistent level.** VO intelligibility: VO level should sit 6–10 dB above music bed when both are present.
7. **Correct metadata.** Embed title, project name, client, version, and ISRC/license info in file metadata (ID3 or BWF chunk).
8. **Version control.** File naming: `[ProjectCode]_[AssetName]_[Version]_[Channel].[ext]`
   Example: `CRI001_RadioSpot_v03_Broadcast.wav`
