# P3 — Android Defer Decision (Option A)

**Date:** 2026-07-03  
**Phase:** P3 Task D  
**Status:** **ACTIVE for first pilot — Android deferred**  
**Day 0 (2026-07-03):** Client intake has **no Android-only requirement on file**. Program default **NO** applies until sponsor confirms otherwise.

---

## Decision

**Android product scope is deferred for the first real client pilot.**

First pilot proceeds on the **web + iOS** path documented in P2 packaging. Android remains a **buildable engineering foundation**, not a **committed pilot deliverable**.

---

## Reason

1. **Pilot program state:** P0–P2 closed on web/iOS contour; Android explicitly deferred until P3 (`PILOT_READINESS_ROADMAP.md`).
2. **Readiness gap:** Android Worker/Manager compile but lack live device E2E, offline parity, and signed distribution proof (`P3_ANDROID_CURRENT_STATE.md`).
3. **Risk management:** Starting Android MVP now threatens pilot timeline and increases demo failure risk without client mandate.
4. **Decision matrix:** Option A scored higher on timeline, evidence, and focus (`P3_ANDROID_DECISION_MATRIX.md`).

---

## What remains supported (first pilot)

| Surface | Supported |
|---------|-----------|
| Web dashboard (owner, admin, manager) | **Yes** — primary manager path |
| Web portal (client/stakeholder) | **Yes** — customer-safe views |
| iOS Worker (TestFlight) | **Yes** — primary field worker path |
| iOS Manager (TestFlight) | **Yes** — optional mobile manager path |
| Production/staging API | **Yes** — shared backend for all clients |
| Android APK/AAB (internal) | **Engineering only** — not client-facing for pilot |

---

## What is not promised (first pilot)

- Android Worker app for field report submission
- Android Manager app for mobile review queue
- Google Play distribution to pilot users
- Android-specific support SLA or runbook
- Feature parity between Android and iOS mobile apps
- Offline-first Android operation queue

---

## Revisit triggers

| Trigger | Action |
|---------|--------|
| **Client requires Android** field devices in signed pilot agreement | Re-open P3 → Option B; authorize `P3_ANDROID_WORKER_MVP_PLAN.md` implementation |
| **After first pilot** closes with structured feedback | Prioritize Android Worker MVP in post-pilot backlog (P4 input, not P4 product expansion) |
| **After P4 feedback** ranks Android as blocking next client | Scope Android Worker MVP with new estimate and GO/NO-GO |
| Owner withdraws defer | Document reversal; do not start code without written authorization |

---

## Future Android Worker MVP scope (when authorized)

Minimal contour (Option B reference — **plan only, not authorized**):

| Item | Scope |
|------|-------|
| Screens | Login, home (tasks), report draft, photo attach, submit, resubmit, sync status |
| APIs | Existing `/api/v1` worker routes (no new backend unless gap found) |
| Session | `SessionStore` encrypted prefs (current) |
| Media | Upload session → Supabase storage → add-media (current ViewModel pattern) |
| Sync | Bootstrap/changes/ack + basic retry; durable offline queue as follow-up |
| Tests | Instrumented launch + staging E2E script + device smoke checklist |
| Distribution | Play internal track; Mode B upload gates per AGENTS.md |
| Done criteria | Login → report → photos → submit → manager decision verified on physical Android device against staging |

**Android Manager** product contour remains **out of scope** until Worker MVP is closed and owner approves Manager parity.

---

## Owner sign-off

| Field | Value |
|-------|-------|
| Decision | **Option A — Android deferred for first pilot** |
| Owner name | _________________________ |
| Date | _________________________ |
| Signature / APPROVED | _________________________ |

**Until signed:** Treat defer as **active** for Day 0; do not implement Android MVP; do not promise Android in client-facing materials.

---

## Day 0 pilot confirmation (2026-07-03)

| Check | Result |
|-------|--------|
| Android required for this pilot | **NO** (no client mandate; intake Android-only = unconfirmed, default NO) |
| Launch blocked by Android | **NO** |
| Action if client later says Android-only | **STOP** — owner chooses iOS devices or authorizes Android Worker MVP |

---

## Phase 6 reconfirmation (2026-07-30)

| Field | Value |
|-------|-------|
| Selected track | **DEFERRED** (not Android MVP readiness) |
| New owner/client Android mandate found | **NO** |
| Operational default (Option A) | **ACTIVE** |
| Formal owner signature | **OPEN** (governance follow-up; does not authorize Android MVP) |
| Android implementation authorized | **NO** |
| Pilot Android claim | **NO** |
| Fresh Debug buildability | **PASS** (`:shared:test`, Worker/Manager `assembleDebug`) |
| Live device / FCM / Play | **NOT_IN_SCOPE** / **BLOCKED_EXTERNAL** / **NOT_AUTHORIZED** |

Evidence: `docs/roadmap/AISTROYKA_PHASE6_ANDROID_DEFERRED_TRACK_CLOSURE_2026-07-30.md`.

---

## Related artifacts

- `docs/mobile/P3_ANDROID_CURRENT_STATE.md`
- `docs/mobile/P3_ANDROID_PILOT_REQUIREMENT.md`
- `docs/mobile/P3_ANDROID_DECISION_MATRIX.md`
- `docs/pilot/P2_PILOT_READINESS_CHECKLIST.md` (Android scope line)
