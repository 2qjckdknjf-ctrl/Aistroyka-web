# Step 9 — Workflow inventory

**Date:** 2026-03-16

## Manager — project intelligence tab

| Field | Detail |
|-------|--------|
| **Entry** | Dashboard → project → Intelligence tab (`ProjectIntelligenceClient`) |
| **User** | Manager with project access |
| **Usefulness** | Strong data density; **before Step 9** weak on trust/degradation vs “broken product” |
| **Pain** | 503 vs empty data looked similar; no compact “why”; no escalation ref |
| **Blind spot** | Operational state (partial/insufficient) not surfaced first |
| **Priority** | P0 |
| **Action** | Operational banner + error state classification |

## Manager — Copilot

| Field | Detail |
|-------|--------|
| **Entry** | Same tab, `CopilotSummaryPanel` |
| **Pain** | Request ID already exposed — OK |
| **Action** | None in Step 9 (scoped to intelligence clarity) |

## Operator — Admin AI page

| Field | Detail |
|-------|--------|
| **Entry** | `/admin/ai` |
| **Usefulness** | Usage KPIs, issues table |
| **Pain** | No route-level AI audit drilldown in UI; API existed (`/admin/ops/ai-runtime`) underused |
| **Action** | `AdminAiRuntimePanel` + enriched API |

## Operator — audit logs

| Field | Detail |
|-------|--------|
| **Entry** | Admin audit API |
| **Pain** | Mixed with non-AI events |
| **Action** | Documented; AI panel filters mentally by route |

## Trace / build

| Field | Detail |
|-------|--------|
| **Pain** | Operators had to read raw JSON |
| **Action** | Correlation block + hints in API + UI |
