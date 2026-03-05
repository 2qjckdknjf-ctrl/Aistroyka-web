# AI Signature System — QA & Observability (Phase 6)

**Project:** AISTROYKA.AI  
**Date:** 2026-02-28

---

## 1. Logging

### Producer (Edge Function)

- **Location:** `engine/Aistroyk/supabase/functions/ai-signature-producers/index.ts`
- **Current:** `console.error` on project loop errors and top-level catch.
- **Recommendation:** Add structured log at start (project count) and on success with counts: `console.log(JSON.stringify({ run: "ai-signature-producers", projects: projectIds.length, schedule_risk: results.schedule_risk, cost_overrun: results.cost_overrun, optimization: results.optimization, milestone: results.milestone, errors: results.errors }))`.

### Client (Web)

- **Location:** `apps/web/lib/services/aiSignature.ts`
- **Current:** `console.warn` in DEV for getCurrentAIState / getProjectIdsWithActiveRisk errors.
- **Recommendation:** Optional debug flag (e.g. `localStorage.getItem("aistroyka:aiSignature:debug")`) to log subscribe callbacks (state row / event payload) in console.

### Client (iOS)

- **Location:** `ios/Aistroyka/Core/AI/AISignatureService.swift`, `AISignatureBridge.swift`
- **Current:** `Logger.error` on subscribe/refresh errors.
- **Recommendation:** In DEBUG, log when state or projectIdsWithRisk updates (e.g. `Logger.debug("AISignatureBridge state=\(row?.currentState.rawValue ?? "nil")")`).

---

## 2. Dev-only panel

### Purpose

- Show current AIState (global and optionally per project).
- Show last 5 AIEvents (global or filtered by project).
- **Simulate event** (dev only): insert a test row into `ai_events` and/or update `ai_state_cache` to verify UI.

### Implementation options

1. **Web:** Add a route or section (e.g. `/admin/ai-signature` or a collapsible block on dashboard) visible only when `NODE_ENV === 'development'` or `NEXT_PUBLIC_AI_SIGNATURE_DEV_PANEL === '1'`. Use `getCurrentAIState(null)` and a query for last 5 events; "Simulate" calls an API route that uses service role to insert one event and upsert state.
2. **iOS:** Add a DEBUG-only view/sheet (e.g. from Settings or a long-press on the AI Insights card) that shows `aiStateEngine.currentState`, `aiSignatureBridge.projectIdsWithActiveRisk`, and a "Simulate risk_detected" button that calls an Edge Function or Supabase client with service role (dev only) to insert a test event.

### Checklist (minimal)

- [ ] Web: dev panel shows current global state + last 5 events (read-only).
- [ ] Web: "Simulate event" (e.g. risk_detected) only when `NEXT_PUBLIC_AI_SIGNATURE_DEV_PANEL=1` and guarded by env.
- [ ] iOS: DEBUG-only UI shows current state + project IDs with risk (read-only).
- [ ] Simulate must not be available in production (no service role or dev route in prod build).

---

## 3. Tests (minimum)

### Unit: state mapping

- **Web:** Map backend `current_state` string to `AIState` and to AISignalLine color/visibility (idle → hidden, risk_detected + severity>70 → danger, etc.). Test file: e.g. `apps/web/components/ai/AISignalLine.test.tsx` or `lib/features/ai/useAIState.test.ts` (state mapping only).
- **iOS:** `Theme.signalLineColor(state:severity:)` and `signalLineOpacity(for:)` — test that idle returns nil, risk_detected with severity>70 returns danger, etc. Test file: e.g. `AISignalLineTests.swift` or inside existing test target.

### Integration: producer thresholds

- **Location:** If the project has a test framework for Edge Functions or DB (e.g. Supabase local + Jest/Deno test), add one integration test: given a project with milestones/tasks that exceed slip threshold (or cost overrun), run the producer and assert one `ai_events` row and `ai_state_cache` updated.
- **Otherwise:** Document in this doc that producer thresholds are manual QA (run producer against a test project with known data and verify events in DB).

### Checklist

- [ ] Unit test: state → color/visibility (web and/or iOS).
- [ ] Integration test for producer (optional; if no test framework, document manual QA steps).

---

## 4. QA checklist (manual)

- [ ] **Backend:** Migration applied; `ai_events`, `ai_event_ack`, `ai_state_cache` exist; RLS allows read for project members and global for authenticated.
- [ ] **Producers:** Cron invokes `ai-signature-producers`; at least one project with schedule slip or cost overrun produces `risk_detected` event and `ai_state_cache` updated.
- [ ] **Realtime (web):** Dashboard AI Insights panel updates state when cache/events change (e.g. after producer run).
- [ ] **Web UI:** AISignalLine hidden for idle; shows correct color for analyzing (indigo), risk (amber/danger), optimization (indigo), milestone (success); tooltip present.
- [ ] **Web UI:** Projects table shows signal on rows for projects with active risk events only.
- [ ] **Web UI:** AI Copilot header shows state and last event title.
- [ ] **iOS:** Dashboard and Projects list show signal; project rows with risk show risk_detected line; AI Assistant header reflects state.
- [ ] **iOS:** No crash when Supabase is unavailable (graceful fallback to idle / empty risk set).

---

## 5. Known limitations

- iOS uses **polling** (10s) for state/events; web uses **Supabase Realtime**. Realtime on iOS can be added when Supabase Swift channel API is confirmed.
- **project_members:** RLS for `ai_events` / `ai_state_cache` assumes `project_members` exists. If the app still uses tenant-only access, policies may need to be relaxed or extended.
- **Global row:** `ai_state_cache` has at most one row with `project_id` null; producers currently only write per-project rows. A separate job or dashboard load can write/update the global row if needed.
