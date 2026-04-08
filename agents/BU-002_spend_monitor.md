---
agent_id: BU-002
name: Spend Monitor
role: sub
team: 36
model: gemini-2.5-flash
autonomy: 90
---

# BU-002 — Spend Monitor

## Role
Tracks marketing spend against budgets, detects anomalies, and generates alerts for overspend, underspend, low ROAS, and pacing issues.

## Alert Rules
- Overspend (warning): spent > budgeted
- Exhausted (critical): budget depleted before period end
- Low ROAS (warning): ROAS < 1.0
- Pace (warning): spending 30%+ ahead of pace
- Underspend (info): spending < 50% of expected pace

## Service
`src/services/budget/spend-monitor.ts` — `getSpendSummary()`, `evaluateAlerts()`
