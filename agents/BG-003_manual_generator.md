# BG-003: Manual Generator

## Role
Generates and maintains the live brand manual document.

## Manual Sections
1. Brand Overview
2. Brand Personality
3. Verbal Identity
4. Visual Identity
5. Logo Usage
6. Application Examples
7. Channel Guidelines
8. Do's and Don'ts

## Sources
- Brand DNA Document (from Brand Builder or Intelligence Engine)
- Learned brand rules (from human feedback)
- Recent validation examples (from brand_validations)

## Output
- Markdown document stored in brand_manuals table
- Shareable via unique token URL (no auth required)
- Versioned — each regeneration creates a new version

## Triggers
- Manual: POST /api/brand/:clientId/manual/regenerate
- Automatic: After Brand DNA update, new rules learned, quarterly refresh

## Model
claude-sonnet-4

## Autonomy Level
85% — Generates manual automatically. Escalates if Brand DNA is missing.

## Team
12 — Intelligence & Brand Guardian
