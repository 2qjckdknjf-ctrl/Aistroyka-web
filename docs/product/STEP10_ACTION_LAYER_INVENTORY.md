# Step 10 — Manager Action Layer Inventory

**Date:** 2026-03-18  
**Scope:** Pre-change snapshot + closure targets.

---

## 1. Dashboard landing — Operations queue (was “What needs attention”)

| Field | Detail |
|-------|--------|
| **Role** | Surface tenant **operational** backlog: overdue tasks, reports to approve, workers without report, stuck uploads, failed AI jobs. |
| **Entry** | `/dashboard` → Intelligence & Alerts section → `DashboardPriorityActionsClient`. |
| **Data** | `GET /api/v1/ops/overview?limit=5` → `buildPriorityItems`. |
| **Semantics** | Queue items with high/medium priority bands; links to task/report/worker/upload/AI routes. |
| **Dead ends** | Empty state read as “all clear” while intelligence could still flag risks (mixed signals). |
| **Overlaps** | Same heading as `ManagerActionView` (“What needs attention”) — different data sources. |
| **Priority** | P0 for coherence. |
| **Closure** | Rename to **Operations queue**, clarify vs intelligence; improve ordering (AI failures not buried); CTA **Act →**. |

---

## 2. AlertFeed (dashboard + `/dashboard/alerts`)

| Field | Detail |
|-------|--------|
| **Role** | Tenant alerts (SLO, quota, AI budget, job spikes). |
| **Entry** | Dashboard strip + full alerts page. |
| **Data** | `GET /api/v1/alerts`. No `resource_id` in schema. |
| **Semantics** | Single “Open related →” by **type only** → generic routes; many dead-end feel. |
| **Dead ends** | Same destination for unrelated alerts of same type; no way to find this row again. |
| **Overlaps** | Thematic overlap with ops queue (AI failures) but different triggers. |
| **Priority** | P0 drill-down. |
| **Closure** | **Two links:** contextual area (labeled) + **Locate on alerts page** (`#alert-{id}`); scroll on alerts page. |

---

## 3. NextActions (`/projects/[id]` — project detail, not dashboard tabs)

| Field | Detail |
|-------|--------|
| **Role** | Deterministic **analysis-history** actions (P0/P1/P2) from `computeActionItems`. |
| **Entry** | Project detail Operations area. |
| **Data** | Snapshots + latest analysis validation; no alerts API. |
| **Semantics** | Text rows; only footer link to intelligence tab. |
| **Dead ends** | No per-row drill-down to where to act. |
| **Overlaps** | Same “next steps” mental model as ManagerActionView but different rules. |
| **Priority** | P0 unification. |
| **Closure** | Title **Next actions (from AI analyses)**; per-row link to dashboard project tab (intelligence / uploads / AI) via `getNextActionHref`. |

---

## 4. ManagerActionView (dashboard project → Intelligence tab)

| Field | Detail |
|-------|--------|
| **Role** | **Intelligence API** items: missing evidence, top risks, recommendations. |
| **Entry** | `ProjectIntelligenceClient`. |
| **Data** | `/api/v1/projects/{id}/intelligence`; `getResourceHref` when refs exist. |
| **Semantics** | Prioritized list with **Act →** when href present. |
| **Dead ends** | Empty “Nothing urgent” blurred thin data vs true calm. |
| **Overlaps** | Duplicate heading with ops queue (before Step 10). |
| **Priority** | P1 labeling. |
| **Closure** | **Intelligence actions** + explicit empty copy; **Act →** aligned with dashboard. |

---

## 5. IntelligenceOperationalBanner

| Field | Detail |
|-------|--------|
| **Role** | Trust band, disclaimers, `next_step_hints`, request_id — **state clarity**, not a queue. |
| **Drill-down** | None by design (supporting context). |
| **Priority** | P2; documented in state clarity doc. |

---

## Biggest coherence gaps (before Step 10)

1. Three “attention” surfaces with same or similar labels (ops / alerts / intelligence / NextActions).  
2. AlertFeed single generic link per type.  
3. NextActions no row-level navigation.  
4. Empty states implied “no problems” without distinguishing **no queue data** vs **no intelligence yet**.
