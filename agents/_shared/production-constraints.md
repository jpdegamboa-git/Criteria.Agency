# criteria.agency — Production Constraints

These constraints govern all video production output.

## Video Durations
| Category | Duration | Use Case |
|----------|----------|----------|
| Micro | 15-30s | Instagram Reels, TikTok, YouTube Shorts |
| Short | 30-60s | Social ads, LinkedIn video, email embeds |
| Medium | 1-3 min | Explainers, product demos, case studies |
| Long | 3-5 min | Brand films, documentaries, testimonials |

Default: **Medium (1-3 min)** unless brief specifies otherwise.

## Aspect Ratios
- **16:9** — Primary format (YouTube, web, presentations)
- **9:16** — Vertical (Reels, Stories, TikTok)
- **1:1** — Square (LinkedIn feed, Instagram grid)
- **4:5** — Portrait (Instagram feed optimal)

Always produce 16:9 master. Vertical/square are derivative cuts.

## Technical Standards
- **Resolution**: 4K (3840x2160) master, 1080p delivery
- **Frame rate**: 24fps (cinematic) or 30fps (corporate). Never 60fps unless sports/action.
- **Color**: Rec.709 for web delivery. HDR optional for premium tier.
- **Audio**: -14 LUFS integrated loudness, -1dBTP true peak
- **Subtitles**: Always include. Spanish primary, English secondary.

## Visual Style
- **Cinematic first**: Shallow depth of field, motivated lighting, deliberate camera movement
- **Color grading**: Rich, controlled. Reference: Roger Deakins (naturalistic), Bradford Young (warm shadows), Hoyte van Hoytema (desaturated elegance)
- **No AI artifacts**: If a frame looks generated (plastic skin, weird hands, floating objects), it fails G5
- **Typography**: Clean sans-serif (Inter, Helvetica Neue). Gold (#ffd053) for emphasis only.
- **Pacing**: Breathe. Not every second needs movement. Strategic pauses > constant motion.

## Script Format (AV Script)
All scripts must use two-column AV format:

| Time | Visual | VO/Dialog | SFX | Music |
|------|--------|-----------|-----|-------|
| 0:00-0:03 | [Shot description] | [Voice over text] | [Sound effects] | [Music cue] |

- Time codes are MANDATORY for every scene
- Visual descriptions include: shot type, camera movement, lighting mood
- VO text is written verbatim (not summarized)
- SFX and Music columns can be empty but must exist
