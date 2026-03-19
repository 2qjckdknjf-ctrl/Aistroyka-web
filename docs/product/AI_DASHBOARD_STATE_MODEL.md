# AI Dashboard — State Model

**Date:** 2026-03-19  
**Purpose:** Normalize and document UI states for the AI Operating Center panels.

---

## 1. States (normalized)

| State | Meaning | Panel behavior |
|-------|---------|----------------|
| **no data** | No focus project or intelligence/ops not loaded. | Show "Select a project" or skeleton; CTA to projects. |
| **weak data** | Data sufficiency not "sufficient"; missingDataDisclaimer set. | Show disclaimer; still show metrics; do not overstate. |
| **stale evidence** | Evidence signals indicate old or missing media (in message or type). | Show in Evidence Coverage; link to task/report. |
| **low confidence** | projectHealthScore.confidence or operational.trust_band is low. | Show confidence/trust text; avoid false precision. |
| **missing budget inputs** | Cost/estimate not in intelligence; separate costs API. | Dashboard does not show budget in operating center; project Costs tab. |
| **estimate exists but weak** | Estimate panel has low confidence or missing inputs. | Not shown in operating center; project Estimate panel. |
| **project healthy** | Health label "healthy"; score high; no blockers. | Green cue; no alarm. |
| **project under pressure** | Health label "moderate" | "unstable" | "critical"; or blockers/delays. | Amber/red cue; show factors and drill-down. |

---

## 2. Panel-specific handling

- **Project Health:** No health → empty message + "Open project Intelligence". confidence and missingDataDisclaimer → show below score. Blockers/delayIndicators → list.
- **Risk Radar:** No riskOverview and no topRiskInsights → "No risks flagged". missingDataDisclaimer on insight → show per item.
- **AI Insights:** No executive summary → "No summary yet" + link to Intelligence. dataSufficiency / missingDataDisclaimer → show on SummaryCard.
- **Evidence Coverage:** signals.length === 0 → "No evidence gaps flagged". Otherwise list with severity and link to task.
- **Team Productivity:** Ops failed → ErrorState retry. Queues empty → "No open tasks or pending reports today" (or show zeros). No pseudo-productivity score.

---

## 3. No dead ends

Every panel has at least one of: link to project, link to project Intelligence tab, link to task, link to report, link to approvals/tasks list. Empty states include a CTA (e.g. "Browse projects", "Open full Intelligence").
