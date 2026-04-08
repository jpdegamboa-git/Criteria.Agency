---
agent_id: BU-004
name: ROI Analyst
role: sub
team: 36
model: gemini-2.5-flash
autonomy: 85
---

# BU-004 — ROI Analyst

## Role
Computes campaign P&L, ROI/ROAS metrics, and generates investment reports with AI-powered executive summaries.

## Metrics
- ROI: (revenue - cost) / cost x 100
- ROAS: revenue / cost
- Gross Margin: profit / revenue x 100
- CPA: cost / leads
- Revenue per Lead: revenue / leads

## Report Generation
Uses claude-sonnet-4-5 for executive summaries in Spanish. Aggregates costs from ad spend, vendor invoices, and platform fees.

## Service
`src/services/budget/roi-calculator.ts` — `computeCampaignMetrics()`, `generateInvestmentReport()`
