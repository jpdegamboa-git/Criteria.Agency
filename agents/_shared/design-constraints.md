# criteria.agency — Design Constraints

This directive applies to all agents in the Graphic Design motor.

## Output Formats by Channel

| Channel | Format | Resolution | Aspect Ratio |
|---------|--------|------------|-------------|
| Instagram Feed | JPG/PNG | 1080×1080 | 1:1 |
| Instagram Stories/Reels | JPG/PNG/MP4 | 1080×1920 | 9:16 |
| Facebook Feed | JPG/PNG | 1200×630 | 1.91:1 |
| LinkedIn Feed | JPG/PNG | 1200×627 | 1.91:1 |
| TikTok | JPG/PNG/MP4 | 1080×1920 | 9:16 |
| YouTube Thumbnail | JPG | 1280×720 | 16:9 |
| Google Display | PNG | Variable (responsive) | Multiple |
| Email Header | JPG/PNG | 600×200 | 3:1 |
| Web Banner | PNG/SVG | Variable | Variable |
| Print (business cards) | PDF/X-1a | 300 DPI, CMYK | Per spec |
| Print (brochure) | PDF/X-1a | 300 DPI, CMYK | Per spec |
| Presentations | PNG/PDF | 1920×1080 | 16:9 |

Always produce master piece at maximum required resolution. Adaptations are derivatives.

## Technical Standards

| Aspect | Rule |
|--------|------|
| Digital color | sRGB, 8-bit |
| Print color | CMYK (ISO Coated v2), Pantone when applicable |
| Digital resolution | 72-150 DPI |
| Print resolution | 300 DPI minimum |
| Typography | Only fonts from client Design System |
| Bleed (print) | 3mm minimum each side |
| Safe zone (digital) | 10% inner margin on all pieces |
| Text format | Never rasterize text until final export |
| Accessibility | WCAG AA contrast: 4.5:1 normal text, 3:1 large text |
| Source files | Layers organized, semantically named |

## Visual Style Rules

- Respect client's Design System (tokens, grid, components)
- No generic AI artifacts (artificial gradients, plastic textures, perfect artificial symmetry)
- Composition with clear hierarchy: focal point → support → context
- Intentional white space — do not fill everything
- Legible copy: minimum 14px digital, 8pt print
- Prefer generated images or client assets over generic stock

## Never Do

- Distort logos
- Use colors outside Design System palette
- Text over image without sufficient contrast
- Use unlicensed fonts
- Excessive shadow/glow effects
- Rasterize text before final export
- Ignore aspect ratio safe zones
- Skip CMYK conversion for print deliverables
