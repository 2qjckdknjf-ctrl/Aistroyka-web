# AI Signature System — Discovery (Phase 0)

**Project:** AISTROYKA.AI  
**Goal:** Drive AISignalLine + StructuralGrid from **real backend data/events**, not fake UI.  
**Date:** 2026-02-28

---

## 1. Backend / engine stack

| Layer | Technology | Location |
| ------- | ------------ | ---------- |
| **Database** | Supabase (Postgres) | `engine/Aistroyk/supabase/migrations/*.sql` |
| **Edge / serverless** | Supabase Edge Functions (Deno) | `engine/Aistroyk/supabase/functions/` |
| **Cron / jobs** | Supabase (e.g. pg_cron) or external | `resilience-cron`, etc. |
| **Realtime** | Supabase Realtime (Postgres changes) | Not yet used for AI state in web/iOS |

**Key Edge Functions:**
- `aistroyka-ai-memory` — AI Memory Layer: snapshots, LLM summaries, fetch_budget_metrics, fetch_schedule_metrics, fetch_contractor_metrics, write_recommendation_feedback; incident detection; control state.
- `aistroyka-llm-copilot` — LLM Copilot (chat).
- `aistroyka-ai-chat`, `aistroyka-admin-ai`, `aistroyka-ai-memory-pipeline` — other AI/chat pipelines.
- `resilience-cron` — resilience / watchdog.

**Conclusion:** Backend is **Supabase Postgres + Edge Functions**. No separate app server. Additive work: new tables (ai_events, ai_event_ack, ai_state_cache), new or extended Edge/cron for producers, Supabase Realtime for delivery.

---

## 2. Current data model (relevant to AI Signature)

### 2.1 Projects
- **Table:** `public.projects`
- **Columns:** `id` (uuid), `name` (text), `created_at` (timestamptz), `tenant_id` (uuid, from later migration).
- **iOS:** `Project` in `Projects/Domain/Project.swift` (id, name, createdAt, tenantId).
- **Web:** Fetched via `/api/projects` → Supabase; `ProjectRow` from RPC/types.

### 2.2 Schedule / tasks
- **Tables:** `public.milestones`, `public.tasks`
- **milestones:** id, project_id, name, planned_start_date, planned_end_date, actual_start_date, actual_end_date, status (pending | in_progress | completed | cancelled).
- **tasks:** id, project_id, milestone_id (nullable), name, status (pending | in_progress | completed | cancelled | overdue), planned_start, planned_end, actual_start, actual_end, owner_id.
- **Access:** Edge function `fetch_schedule_metrics` (project_id) returns milestones[], tasks[].
- **Integration point:** Schedule risk = f(planned_end vs forecast/actual, overdue task count). No dedicated “forecast_end_date” column; can derive from tasks/milestones or add later.

### 2.3 Costs / budgets
- **Tables:** `public.project_budget`, `public.cost_items`, `public.commitments`
- **project_budget:** project_id, tenant_id, baseline_amount, approved_changes, contingency_pct, currency_code, updated_at.
- **cost_items:** project_id, category, planned_amount, actual_amount, committed_amount, as_of_date.
- **Access:** Edge `fetch_budget_metrics` (project_id) returns budget, cost_items[], commitments[].
- **Integration point:** Cost overrun = (sum actual or committed) vs (baseline + approved); threshold-driven risk_detected.

### 2.4 Reports
- **Tables:** `public.ai_portfolio_daily`, `public.ai_portfolio_weekly_rollups` — portfolio aggregates (project_count, avg_risk, high_risk_count, etc.).
- **recommendations:** project_id, tenant_id, type (budget | schedule | contractor | copilot), title, score, impact_amount, impact_days, status (active | applied | dismissed).
- **Integration point:** Recommendations can drive optimization_found; portfolio tables can feed global/tenant-level state.

### 2.5 AI analysis artifacts
- **Tables:** `public.ai_analysis` (per media: stage, completion_percent, risk_level, detected_issues, recommendations); `public.ai_incidents`, `public.ai_incident_events`, `public.ai_control_state`; `ai_llm_logs`, `ai_memory_*`, etc.
- **No existing “AI events” or “AI state cache” table** that the UI consumes for the signature system. Current iOS AI state is **in-memory only** (AIStateEngine) and derived from DashboardViewModel after `fetchSnapshot()` (AIPredictiveService → AIDataAggregator → projects + analysis results from Supabase).

---

## 3. Current web + iOS state management

### 3.1 Web

- **Data fetching:** TanStack Query (`useProjects`, `queryKeys.projects`); `/api/projects` and other API routes; `engineFetch` for Edge (AI/copilot).
- **State:** React state + server state (TanStack Query). No global “AI state” store; no subscription to backend AI events.
- **Integration point:** New client SDK (e.g. `aiSignature.ts`) to `getCurrentAIState(projectId?)`, `subscribeAIState`, `subscribeAIEvents` backed by Supabase (realtime or poll).

### 3.2 iOS

- **AI state:** `AIStateEngine` (ObservableObject) in `Core/AI/AIStateEngine.swift`; singleton in `AppContainer`; injected as `.environmentObject(aiStateEngine)`.
- **Drivers:** `DashboardViewModel` calls `aiStateEngine.transition(to:)` after loading snapshot (e.g. risk_detected if risk ≥ 66, optimization_found if recommendations non-empty, else idle). No backend source of truth; state is derived once per fetch.
- **Data:** Dashboard snapshot from `AIPredictiveService.fetchSnapshot()` → `AIDataAggregator.fetchRawAggregate()` (projects + analysis jobs/results from Supabase). Portfolio/Reports use their own view models and APIs.
- **Integration point:** New `AISignatureService` (or extend existing client) to fetch `ai_state_cache` and subscribe to `ai_events` (Supabase Realtime or poll), and drive `AIStateEngine` from that.

---

## 4. Integration points (for Phases 1–7)

| Area | Current | Target |
| ------ | --------- | -------- |
| **Canonical state** | In-memory enum only (iOS) | DB: `ai_state_cache` (project_id, current_state, last_event_id); `ai_events` as source of truth. |
| **Events** | None | Table `ai_events` (id, project_id, type, severity, title, summary, drivers, sources, created_at, expires_at, origin, status); `ai_event_ack` for user acks. |
| **Producers** | None (UI-only transitions) | Edge/cron: schedule risk (milestones/tasks), cost overrun (budget/cost_items), optimization (recommendations), milestone achieved (milestones/tasks status). |
| **Delivery** | N/A | Supabase Realtime on `ai_events` and `ai_state_cache` (or poll); client SDK (web + iOS) to consume and update UI state. |
| **UI (web)** | No AISignalLine/StructuralGrid from backend | AISignalLine + StructuralGrid driven by `getCurrentAIState` / `subscribeAIState` and attach to Dashboard, project rows, AI Assistant. |
| **UI (iOS)** | AISignalLine + Blueprint driven by local AIStateEngine | Same components, but AIStateEngine fed by AISignatureService from `ai_state_cache` + `ai_events`. |
| **RLS** | Projects/tenants already RLS | New tables: users read events for projects they have access to; ack per user. |

---

## 5. Risks and constraints

- **Backward compatibility:** Existing APIs and snapshot-based dashboard remain; new tables and subscriptions are additive. iOS can fall back to current derived state if realtime/backend unavailable.
- **Minimal first:** Phase 1 = schema + RLS; Phase 2 = one or two producers (e.g. schedule risk + cost overrun) with simple thresholds; Phase 3 = single channel (e.g. poll or realtime) for web + iOS.
- **No breaking changes:** Do not remove or rename existing columns/tables; do not change existing RLS policies except to add new ones for new tables.

---

## 6. Files and references

- **Migrations:** `engine/Aistroyk/supabase/migrations/` (20250222000000_initial_schema.sql, 20250222100000_media_and_ai_analysis.sql, 20250228210000_product_copilot_domain.sql, 20250228140000_ai_portfolio_tables.sql, 20250228190000_ai_incident_tables.sql).
- **Edge:** `engine/Aistroyk/supabase/functions/aistroyka-ai-memory/index.ts` (fetch_schedule_metrics, fetch_budget_metrics, etc.).
- **iOS:** `Core/AI/AIStateEngine.swift`, `AppShell/DashboardViewModel.swift`, `Core/AI/AIPredictiveService.swift`, `Core/AI/AIDataAggregator.swift`.
- **Web:** `apps/web/lib/projects/useProjects.ts`, `apps/web/lib/engine/client.ts`, `apps/web/app/api/projects/route.ts`.
- **Docs:** `reports/step-01-domain-data-model.md`, `docs/AI_SIGNATURE_SYSTEM.md`.
