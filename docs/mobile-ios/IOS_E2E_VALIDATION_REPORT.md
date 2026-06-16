# iOS — E2E validation (Phase 9)

**Project:** AISTROYKA  
**Date:** 2026-05-19  
**Depends on:** Phases 0–8 closure reports in `docs/mobile-ios/`.

## What “E2E” means here

| Layer | Scope | Backend |
|--------|--------|---------|
| **A — UITest smoke** | Login surface reachable; stable **`pilot_*`** accessibility ids; **`AISTROYKA_UI_TEST=1`** launch hooks skip intro / normalize cold start | **No** real API (simulator, no tenant) |
| **B — Staging / pilot E2E** | Auth → project pick → report flow → manager review → evidence URLs → resubmit → help card (`activation` / `help`) | **Yes** — real or staging app URL + Supabase |

Phase 9 is **closed for documentation + layer A** once this file exists and CI is defined. **Layer B** stays **open** until someone appends **dated, environment-labeled** results (below).

---

## Layer A — Automated (repository truth)

### CI

- Workflow: `.github/workflows/ios-ui-smoke.yml`
- **Triggers:** `workflow_dispatch`; `pull_request` to `main` / `master` when `ios/**` changes (excluding **`ios/**/*.md` only**).
- **Tests:**
  - `AiStroykaWorkerUITests/WorkerSmokeUITests/testLoginScreen_reachableWithPilotIdentifiers`
  - `AiStroykaManagerUITests/ManagerSmokeUITests/testLoginScreen_reachableWithPilotIdentifiers`
- **Gate policy:** manager smoke is blocking in CI (no `continue-on-error`).
- **Signing:** `CODE_SIGN_IDENTITY=-`, `CODE_SIGNING_REQUIRED=NO` (fork-friendly).

### Local (same tests as CI)

```bash
# Mimic CI signing:
CI_SIGNING_HACK=1 bash ios/scripts/run-ios-uitest-smoke-local.sh
```

See `ios/README.md`.

**Logged local run (Layer A):** 2026-05-19 — `CI_SIGNING_HACK=1 bash ios/scripts/run-ios-uitest-smoke-local.sh` — **PASS** (both `WorkerSmokeUITests` and `ManagerSmokeUITests` login-surface tests; ~6.5 min on maintainer machine).
**Latest rerun:** 2026-05-21 — `CI_SIGNING_HACK=1 bash ios/scripts/run-ios-uitest-smoke-local.sh` — **PASS** (login-surface coverage remains stable; full runtime transaction chain still pending Layer B).

**Layer B API chain (2026-06-03):** `BASE_URL=https://aistroyka.ai ./scripts/smoke/ios_mobile_api_chain.sh` with `.env.pilot` — **PASS** (worker report create + sync; manager me + reports). Canonical mobile transaction proof for publication.

**Layer B UITest (local):** `bash ios/scripts/run-ios-e2e-integration-local.sh` with `.env.pilot` + `apps/web/.env.local` + `IOS_E2E_BASE_URL=https://aistroyka.ai` — **PASS** (2026-06-16, branch `fix/smoke-json-arm64`): all three live tests green (~93s wall time): `testManager_livePilot_projectIntelligenceAndCopilot`, `testManager_livePilot_loginAndReachReportsInbox`, `testWorker_livePilot_loginAndOpenNewReportDraft`. Runner auto-pins `IOS_E2E_PROJECT_ID`, preflights `/api/v1/me`, writes gitignored `ios/Config/.uitest-e2e-credentials`. JSON parsing uses `scripts/smoke/_json_lib.sh` (Apple Silicon–safe). Optional `IOS_E2E_ONLY_TEST`, `IOS_E2E_SKIP_WORKER=1`.

### Limits of layer A

- Does **not** exercise **network**, **RLS**, **lite allow-list**, **push**, or **offline queue** reconciliation.
- **Debug** builds use `TextField` for worker/manager password in UITest so Simulator can fill (see test file comments).

---

## Layer B — Staging / pilot checklist (append results)

Printable short lists: `docs/mobile-ios/manual-smoke/worker-smoke.md`, `manager-smoke.md`.

Use a **pilot tenant** and record: **date**, **app build** (git SHA or Xcode build), **API base URL**, **test accounts** (roles), **pass/fail**, **notes** (screenshot path optional).

| # | Step | Worker | Manager | Result / link |
|---|------|--------|---------|----------------|
| 1 | Sign in | ☐ | ☐ | **PASS** (API chain 2026-06-03) |
| 2 | Worker: select project, start/end shift (if used) | ☐ | — | **PASS** partial (day/start + projects in API chain) |
| 3 | Worker: create/submit report with photos; queue drains | ☐ | — | **PASS** partial (report/create API); photo/submit UI manual |
| 4 | Manager: inbox lists report; **evidence** thumbnails load (`file_url`) | — | ☐ | **PASS** partial (reports list API) |
| 5 | Manager: approve / request changes + **note** / reject + **note** | — | ☐ | |
| 6 | Worker: `changes_requested` appears; **resubmit**; thumbnails on resubmit | ☐ | — | |
| 7 | Worker: home **help** card — hints or assistant summary (after lite allow-list fix) | ☐ | — | |
| 8 | Manager: **AI** tab jobs; project **Intelligence** + **Copilot** screens | — | ☐ | **PASS** API (`ios_mobile_api_chain` 2026-06-04) + **PASS** UITest (2026-06-16, `https://aistroyka.ai`) |
| 9 | Push: assign task → Worker receives update (optional) | ☐ | — | |

**Staging log policy:** Do not paste secrets, tokens, or PII. Use internal links or ticket IDs.

---

## Phase 9 closure

### A. PHASE STATUS (this repository pass)

**INCREMENTAL CLOSED (Layer B API chain + live UITests on pilot)**

- **Delivered:** Layer A CI, Layer B API chain (`scripts/smoke/ios_mobile_api_chain.sh`), Layer B UITests + `run-ios-e2e-integration-local.sh` (Manager intelligence/copilot + reports inbox; Worker report draft compose).
- **Not delivered here:** Full simulator photo upload + manager review tap chain (TestFlight / manual checklist).

### B. WHEN TO MOVE TO PHASE 10

Phase 10 (TestFlight) should assume **at least one** completed **Layer B** pass on a build candidate, plus symbolication / crash hooks as per org process.

### C. NEXT PHASE ALLOWED

**YES** — Phase 10 runbook: `IOS_TESTFLIGHT_PILOT_REPORT.md` (after Layer B on a release candidate).

---

*End of Phase 9 report.*
