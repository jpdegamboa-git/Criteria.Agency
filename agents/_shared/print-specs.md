# Print Specs — Print Production Pipeline Directive

Technical specifications and quality standards for all print deliverables produced in the Print Production pipeline.

---

## Resolution

| Use Case | Minimum DPI | Recommended DPI | Notes |
|----------|-------------|-----------------|-------|
| Standard print (business cards, flyers, brochures) | 300 DPI | 300 DPI | At final print size |
| Fine art / photo reproduction | 300 DPI | 400 DPI | At final print size |
| Large format (banners, posters ≥A0) | 150 DPI | 150–200 DPI | At final print size |
| Super large format (vehicle wraps, billboards) | 72–100 DPI | 100 DPI | At final print size |
| Screen printing / embroidery (vectors) | N/A — use vectors | — | Convert to paths |

---

## Color

| Standard | Specification |
|----------|--------------|
| **Color mode** | CMYK for all print files (never RGB or hex) |
| **Pantone spot colors** | Use Pantone Solid Coated (C) or Uncoated (U) per substrate; specify swatch in file |
| **Rich black** | C40 M40 Y40 K100 for large black areas (text black remains K100 only) |
| **Text black** | K100 only (no rich black on body text to avoid misregistration blur) |
| **Color profile** | Embed ICC profile: ISO Coated v2 (FOGRA39) for offset; GRACoL 2013 for sheet-fed |
| **Overprint** | Black text set to overprint; verify in Acrobat output preview |
| **Total ink coverage** | Maximum 300% TAC for offset; 280% for digital press |

---

## Bleed & Safe Zone

| Format | Bleed | Safe Zone (live area inset from trim) |
|--------|-------|---------------------------------------|
| Standard (up to A3 / 17"×11") | 3 mm (0.125") | 5 mm (0.1875") from trim |
| Large format (A2 and above, banners) | 5 mm (0.25") | 10 mm from trim |
| Packaging / dielines | 3 mm (0.125") | As per dieline spec |
| Business cards | 3 mm | 3 mm |

All full-bleed artwork must extend to the bleed edge. No critical content (text, logos) within the safe zone margin.

---

## File Formats

| Format | Use | Notes |
|--------|-----|-------|
| **PDF/X-1a** | Preferred for offset and digital print | All fonts embedded; CMYK only; no transparency |
| **PDF/X-4** | Acceptable for modern digital presses | Supports transparency; ICC-managed color |
| **AI / INDD** | Packaged source files (optional, per client request) | Include all linked files and fonts |
| **TIFF** | Raster images embedded in layouts | Flattened, CMYK, 300 DPI |
| **EPS** | Vector logos / spot color elements | Outline fonts; no embedded RGB |

Do not submit: RGB PDFs, password-protected PDFs, JPEGs as primary deliverables, or unpackaged native files without links.

---

## Typography

| Standard | Requirement |
|----------|-------------|
| **Fonts** | Convert all text to outlines/curves before final export (no live text in PDF/X-1a) |
| **Minimum body text size** | 6 pt (absolute minimum); 8 pt recommended for readability |
| **Minimum reversed text size** | 8 pt minimum; 10 pt recommended for reversed (white on dark) text |
| **Tracking / kerning** | Optically kern headlines; no negative tracking on body text |
| **Hyphenation** | Disabled for headlines and captions; optional for justified body copy |
| **Overset text** | Zero tolerance — all text must be visible and fully typeset |

---

## Common Print Types

| Product | Standard Size | Bleed | Finish Options | Key Notes |
|---------|--------------|-------|----------------|-----------|
| **Business cards** | 85×55 mm (EU) / 88.9×50.8 mm (US) | 3 mm | Matt, gloss, soft-touch, spot UV | Portrait or landscape; double-sided separate files |
| **Flyers** | A5 (148×210 mm), A6 (105×148 mm) | 3 mm | Matt, gloss | Single or double-sided |
| **Brochures** | A4 trifold (210×297 mm folded), DL (99×210 mm) | 3 mm | Matt, gloss, silk | Supply flat artwork; mark fold lines |
| **Banners (roll-up)** | 850×2,000 mm | 5 mm | Satin, matt | Artwork top-to-bottom; allow 100 mm bleed at base for cassette |
| **Banners (outdoor PVC)** | Custom | 5 mm | Gloss, backlit | 150 DPI at size; add eyelets to spec |
| **Packaging** | Per dieline | 3 mm | Varies | Follow supplied dieline; use spot colors for Pantone accuracy |
| **Posters (A1/A0)** | 594×841 mm / 841×1,189 mm | 5 mm | Matt, silk | 150 DPI minimum at final size |

---

## Pre-Flight Checklist

Before submitting any print file to production:

- [ ] Color mode: CMYK (or CMYK + Pantone spot)
- [ ] Resolution: 300 DPI at 100% size (150 DPI for large format)
- [ ] Bleed applied and artwork extends to bleed edge
- [ ] All critical content within safe zone
- [ ] Fonts converted to outlines
- [ ] Rich black applied to large black fills (K100 only for text)
- [ ] ICC profile embedded
- [ ] Total ink coverage within limits
- [ ] No RGB or transparency issues (verify in Acrobat output preview)
- [ ] PDF/X-1a or PDF/X-4 export confirmed
- [ ] Proof reviewed and approved by Creative Director
