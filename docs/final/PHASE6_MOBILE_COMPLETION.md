# Phase 6 — Mobile completion layer (completion)

**Date:** 2026-03-23  
**Tracks:** [AISAA-14](/AISAA/issues/AISAA-14)  
**Parent:** [AISAA-1](/AISAA/issues/AISAA-1)

## Completion criteria (from ticket) vs repo

| Criterion | iOS | Android |
|-----------|-----|---------|
| Separate Manager + Worker apps | **Yes** — two `.xcodeproj`s | **Yes** — two modules, **no** feature parity |
| Shared code in Shared / `shared` | **Yes** — Swift package with networking + auth | **No meaningful shared layer** — single `Config.kt` |
| Calls `/api/v1` consistent with web worker/manager flows | **Worker:** strong alignment with worker + sync + media APIs | **No** |
| | **Manager:** aligned with **subset** of web manager APIs (see inventory) | **No** |
| Offline / resilience | **Worker:** operation queue, sync bootstrap/changes/ack, background upload hooks | **Not implemented** |
| Production-ready polish | **Code present**; signing/secrets operator-dependent | **Placeholder UI only** |

## What is “done” in engineering terms

1. **iOS Worker** — vertical slice: login (Supabase), project pick, tasks, day start/end, report create + media + submit, device registration, sync pipeline with 409 handling.
2. **iOS Manager** — vertical slice: login, tabbed shell (dashboard, projects, tasks, reports, team, AI, notifications, settings), wired to documented manager endpoints.
3. **Android** — Gradle multi-module **scaffold** only; README copy claims parity with iOS **at product description level** but **implementation does not match**.

## What is not done

1. **Android** — no API client, no auth, no navigation beyond placeholder `Text`.
2. **Parity with current web** — owner, portfolio, document decision, issues, attention, timeline, billing, plan-fit: **absent** on iOS Manager.
3. **CI** — **partial:** `.github/workflows/ios-ui-smoke.yml` builds and runs **AiStroykaWorker** + **AiStroykaManager** simulator UITest smoke when `ios/**` changes (and on `workflow_dispatch`); **Android** instrumented smoke exists as a separate manual workflow (`android-instrumented-smoke.yml`). Release/code-sign to device is still operator-driven.
4. **Automated tests** — **partial:** iOS login-surface UITests (`pilot_*` accessibility ids); Android small unit tests under `android/shared` (e.g. submit body JSON). Broad UI/E2E coverage on mobile is **not** implemented.
5. **Live production proof** — blocked on operator remediation for [AISAA-11](/AISAA/issues/AISAA-11) for API/RLS truth (same as web).

## Backend dependency note

Mobile apps are **not** an escape hatch from Phase 3 blockers: they consume the same Next.js `/api/v1` surface and Supabase-backed auth as web. Fixing health/RLS in production is prerequisite for trustworthy mobile E2E, not a substitute for Android implementation work.
