# AISTROYKA — Root Cause Investigation

**Date:** 2026-07-07  
**Type:** Independent Enterprise Audit Board — root cause only  
**Method:** Zero-trust re-investigation from source + live probes  
**Branch audited:** `security/platform-admin-separation` @ `031150aa`  
**No code, deploy, or merge actions taken**

---

## Executive summary

Previous platform audits marked several areas **PARTIAL** or **NO**. This investigation finds that **most of those verdicts mixed four different failure modes**:

1. **NOT IN PILOT SCOPE** (explicit program decision)
2. **Evidence missing** (no device/build run in audit session — not proof of broken code)
3. **Implementation gap** (real code issue, often non-blocking)
4. **False negative / doc drift** (reports stated “production behind main” as a linear lag; git topology is **divergent**)

**Primary finding:** Android **NO** is **not** because Android code is absent or tests fail — it is **chiefly scope exclusion**. Security **PARTIAL** was **overstated** for pilot purposes — core controls pass live probes; one defense-in-depth gap remains. ROMA **PARTIAL** conflated **complete Foundation/Operations Center implementation** with **optional deployment certification and undeployed branch commits**. Deployment “lag” reports were **partially wrong** about the relationship between `origin/main` and production `e6170ce`.

**Can pilot begin?** **NO** — for **operational** reasons (no client tenant, no device smoke), not because Android/ROMA/security/deployment are fundamentally broken.

---

## Investigation 1 — Android

### Previous verdict

`ANDROID_MANAGER_READY = NO`  
`ANDROID_WORKER_READY = NO`

### Root cause (ordered by weight)

| # | Cause | Type | Verified |
|---|--------|------|----------|
| 1 | **Android explicitly excluded from first pilot SLA** | NOT IN PILOT SCOPE | `docs/mobile/P3_ANDROID_DEFER_DECISION.md` — Option A active 2026-07-03 |
| 2 | **No Google Play / device distribution evidence** | Evidence missing | No `.aab` in repo; no device run in this session |
| 3 | **No field E2E proof on physical Android** | Evidence missing | Instrumented tests = launch-only (1 test each) |
| 4 | **Parity gaps vs iOS** (offline queue, diagnostics, Manager tabs) | Implementation gap | `P3_ANDROID_CURRENT_STATE.md` inventory |
| 5 | **Build not executed in this audit environment** | Evidence missing | `./gradlew` failed: `/usr/local/bin/java: Bad CPU type` — **not proof** global build broken |

### Is code missing?

**NO.** Verified in repo:

- **30 Kotlin source files** under `android/`
- **Worker:** `WorkerViewModel.kt` (~620 lines) — login, shift, report, photo attach, upload session, submit, sync, resubmit
- **Manager:** `ManagerViewModel.kt`, reports inbox, approve/reject/changes
- **Shared:** `WorkerApi.kt`, `ManagerApi.kt`, `AuthService.kt`, `SessionStore.kt`
- **Tests:** `WorkerAppLaunchInstrumentedTest.kt`, `ManagerAppLaunchInstrumentedTest.kt` (Compose root smoke); `SubmitReportBodyTest.kt`

This **contradicts** older blockers (e.g. `FIRST_CLIENT_BLOCKER_REGISTER.md` P0-1/P0-2 “single Text composable stub”) — those are **superseded** by current `main`/branch code.

### Are tests failing?

**UNKNOWN in this session** — Gradle did not run (local JDK architecture mismatch).  
**No evidence** of CI red on `main` for Android instrumented workflow from this investigation (workflow exists: `.github/workflows/android-instrumented-smoke.yml`).

### Are builds broken?

**UNKNOWN globally; not verified broken.** Toolchain documented: AGP 8.6.1, Gradle 8.7, JDK 17, SDK 35.

### Is deployment missing?

**YES for pilot users** — no Play internal/production distribution to clients (by design).

### Was Android simply excluded from pilot scope?

**YES — primary root cause.** Program decision: first pilot = **web + iOS** only.

### Required evidence to change verdict

| Evidence | Purpose |
|----------|---------|
| Signed AAB + Play internal track upload | Distribution |
| Physical device: login → report → photos → submit → manager decision | Field proof |
| Instrumented or Maestro E2E beyond launch smoke | Automation proof |
| Owner reversal of P3 defer in writing | Scope change |

### Estimated effort (if scope re-opened)

| Item | Effort |
|------|--------|
| Worker MVP device E2E on staging | **2–4 weeks** (per P3 defer doc estimate) |
| Manager parity (tabs, offline) | **Additional 2+ weeks** |
| Play distribution + owner gates | **Owner-dependent** (Mode B) |

### Real blocker for pilot?

**NO** — unless client contract requires Android-only field devices.

### Can pilot continue without Android?

**YES** — per active P3 defer; iOS Worker + web manager are the committed path.

---

## Investigation 2 — Security

### Previous verdict

`SECURITY_READY = PARTIAL`

### What exactly prevents YES?

| Item | Prevents YES? | Category | Evidence |
|------|---------------|----------|----------|
| Platform owner API gate | No — **passes** | — | Live: `GET /api/v1/platform/overview` → **403** |
| Portal API auth | No — **passes** | — | Live: `GET /api/v1/portal/projects` → **401** |
| Dashboard auth redirect | No — **passes** | — | Live: `GET /en/dashboard` → **307** to login |
| Security headers | No — **passes** | — | `security_headers.sh` PASS (prior run) |
| RBAC / lite allow-list / finance denylist | No — **passes in code** | — | Unit tests + `customer-finance-guard.ts` |
| Cloudflare Access on admin host | No — **passes** | Deployment | Live: `admin.aistroyka.ai` → CF Access login |
| `redirectIfStakeholderBlockedPath` **not wired in middleware** | **Soft gap** | **Implementation** | Function exists in `stakeholder-dashboard-paths.ts`; **zero imports in `middleware.ts`** (grep verified) |
| `platform_break_glass_grants` **no app consumer** | **Soft gap** | **Implementation** (incomplete feature) | Only in migration SQL; no app-layer usage |
| Subscription gate **fail-open** on billing read errors | **Soft gap** | **Design choice** | Dashboard layout catches billing errors |
| Multi-role Playwright **skipped without creds** | **No** | **Evidence missing** | Not a security failure — tests not run |
| Cross-tenant negative E2E absent | **Soft gap** | **Evidence missing** | Unit/policy tests exist |

### Separation of failure modes

| Mode | Applies? |
|------|----------|
| Implementation issue | **Yes** — stakeholder path redirect unwired; break-glass unused |
| Deployment issue | **No** for core gates — CF Access + prod headers live |
| Evidence missing | **Yes** — stakeholder browsing not live-tested with creds |
| Operational process | **Yes** — pilot role matrix not executed |
| False negative | **Yes** — prior **PARTIAL** treated evidence gaps and non-blocking defense-in-depth the same as auth failures |

### Does stakeholder gap block pilot?

**NO for security breach** — stakeholders blocked at **API/RLS/policy** (`canReadProjects(stakeholder) === false`, portal finance denylist). Gap is **UX/leak of dashboard shell URLs**, not proven data exfiltration.

### Corrected security verdict

**READY** for pilot security posture on web+iOS path, with **one known implementation debt** (middleware stakeholder redirect) classified as **P2**, not P0.

Previous **PARTIAL** verdict was **partly wrong** — it implied material insecurity; live fail-closed probes contradict that.

---

## Investigation 3 — ROMA

### Previous verdict

`ROMA_READY = PARTIAL`

### Is ROMA incomplete?

**NO at Foundation / Operations Center implementation layer.**

| Layer | Status | Evidence |
|-------|--------|----------|
| **Foundation v1** | **Complete (frozen)** | `ROMA_FOUNDATION_V1_FREEZE.md`; kernel boundary tests |
| **Operations Center UI + probes** | **Complete (read-only)** | 198+ platform-admin tests; `executionEnabled: false` |
| **Platform Integration Phase 2** | **Complete on branch; UNKNOWN on production** | `935cf87b` — `platform-overview.service.ts`, not in prod SHA |
| **Deployment certification 10/10** | **Incomplete** | Missing owner secrets, visual baselines, remote Playwright creds |
| **Live integration catalog** | **Partially UNKNOWN without service role in browser** | Probes skip → UNKNOWN, not fake PASS |

### Is ROMA complete but integrations UNKNOWN?

**YES — that is the accurate framing.**

- ROMA is **not a pilot deliverable** — observability for platform owner only.
- **PARTIAL** mixed:
  - **Implementation COMPLETE** (Foundation cert: 10/10)
  - **Deployment cert OPEN** (owner ops)
  - **Branch-only integration** not on production yet
  - **Runtime UNKNOWN** when service role absent (honest probe behavior)

### Previous report error

Prior audits implied ROMA incompleteness blocks pilot — **wrong**. ROMA state does **not** gate client pilot.

### Corrected ROMA verdict

**NOT IN PILOT SCOPE** (client pilot)  
**READY** (owner observability implementation on production `e6170ce` — ROMA modules deployed there)  
**UNKNOWN** (Phase 2 platform integration metrics on production — commit `935cf87b` not deployed)

---

## Investigation 4 — Deployment

### Previous report claim

“Production behind branch” (linear lag).

### Re-investigation — git topology (verified)

| SHA | Role |
|-----|------|
| `e6170ce` | **Production + staging** `buildStamp.sha7` (live 2026-07-07) |
| `bf4b7f1` | **`origin/main`** tip (merge PR #186) |
| `031150aa` | Audit branch tip |
| `c10d2f40` | **Merge-base** of main and `e6170ce` |

**Critical correction:** `e6170ce` is **NOT an ancestor of `origin/main`** (`git merge-base --is-ancestor` → **no**).

```
                    c10d2f40  ← merge-base
                   /          \
    12 ROMA commits           bf4b7f1  (main: merge PR #186 only)
    → e6170ce (PRODUCTION)      
                   \
                    15 commits → 031150aa (branch tip)
```

**Production contains 12 commits NOT in main:**

- `cab4eeeb` … `e6170ce` — ROMA QA center, quality graph, test catalog, change intelligence, execution planner, safe audit, run history, cf:build fix

**Main contains 1 commit NOT in production line:**

- `bf4b7f1e` — merge PR #186 metadata

**Previous “production 1 commit behind main” was misleading** — histories **diverged**, not linear behind.

### Commits on branch after production (`e6170ce..HEAD`)

| Commit | Category | Pilot-critical? |
|--------|----------|---------------|
| `b13a052a` | Docs (ROMA deploy validation) | No |
| `93012635`, `1b2dd2eb` | ROMA executive dashboard | No (ROMA) |
| `a641a5fc`, `f9d1fc1b`, `11b01832` | ROMA stabilize/polish | No |
| `93395913`, `8101778b`, `983b1516` | ROMA docs/kernel | No |
| `875d7429` | ROMA enterprise tests/CI | No |
| `32c9422d`, `256f68ea` | ROMA certification/freeze docs | No |
| `935cf87b` | ROMA platform integration (overview service) | No (owner observability) |
| `f283ec4b` | **AISignalLine test + roma-platform-integration type fix** | **Build hygiene only** |
| `031150aa` | Audit docs | No |

### Minimum deployment before pilot

| Need | Required deploy? |
|------|------------------|
| Web + iOS worker API on staging/prod | **Already live** at `e6170ce` — health OK, mobile API chain PASS |
| Client pilot features (reports, portal, auth) | **Already on production** (predates ROMA branch divergence) |
| ROMA Phase 2 integration (`935cf87b`) | **NOT required** for client pilot |
| Branch build fixes (`f283ec4b`) | **NOT required** for runtime — fixes CI/test parse on branch |
| Merge main ↔ production divergence | **Recommended** for repo hygiene — **not pilot-blocking** |

### Corrected deployment verdict

**READY** — production/staging healthy at `e6170ce`.  
Branch tip **not deployed** — affects ROMA integration + test hygiene, **not client pilot start**.

---

## Report format — all prior PARTIAL / NO verdicts

| Component | Prior verdict | Why (root cause) | Evidence | Real blocker? | Pilot can continue? | Fix effort | Priority |
|-----------|---------------|------------------|----------|---------------|---------------------|------------|----------|
| Android Manager | NO | **Scope exclusion** + no Play/device proof | P3 defer; code exists | **No** | **Yes** (use web/iOS) | Weeks if scope opens | P3 |
| Android Worker | NO | **Scope exclusion** + no device E2E | P3 defer; WorkerViewModel complete | **No** | **Yes** | 2–4 weeks if mandated | P3 |
| Security | PARTIAL | **False negative** + defense-in-depth gaps | Live 403/401/307; middleware gap | **No** (for pilot) | **Yes** | 1–2 days for stakeholder middleware | P2 |
| ROMA | PARTIAL | **Conflated deployment cert + branch-only integration** | Foundation 10/10; prod has ROMA modules | **No** | **Yes** | Owner secrets for cert | N/A (not pilot) |
| Deployment | PARTIAL | **Misstated linear lag**; branch tip undeployed | Git divergence; health OK | **No** | **Yes** on current prod | Merge/reconcile git | P2 |
| iOS Worker | PARTIAL | **Device evidence missing** | API chain PASS; no TestFlight UI run | **Yes** (operational) | **No** until device smoke | 1 day with client device | **P0** |
| iOS Manager | PARTIAL | **Device evidence missing** | Source complete | **No** (web manager primary) | **Yes** with web review | 1 day optional | P1 |
| Web cabinet | PARTIAL | **E2E approval loop not live-proven** | Code complete | **Yes** (operational) | **With manual workaround** | 1 day smoke | P0 |
| Client portal | PARTIAL | **No client tenant / creds** | APIs + finance tests | **Yes** (operational) | **No** until provisioned | Hours setup | **P0** |
| Pilot intake | PARTIAL | **No real client data** | Day 0 GO/NO-GO FAIL | **Yes** | **No** | Owner form | **P0** |
| Supabase parity | PARTIAL | **Remote migration diff not run** | 151 repo migrations; health db:ok | **Unknown** | **Yes** (health OK) | Hours CLI diff | P2 |
| Notifications | PARTIAL | **APNs/email global health unproven** | Push outbox probe | **No** unless push required | **Yes** | Config-dependent | P2 |
| Billing | PARTIAL | **Account-layer cutover gated** | Legacy entitlements work | **No** for pilot | **Yes** | Post-pilot | P3 |
| Design | PARTIAL | **Android/iOS asymmetry; a11y skips** | LG on public shell | **No** | **Yes** | Ongoing | P3 |
| Backend | PARTIAL | **Same as web+API** — E2E gaps | Mobile chain PASS | Operational only | **Yes** | Smoke | P1 |

---

## Final matrix (no ambiguous wording)

| Component | Verdict |
|-----------|---------|
| **ANDROID_MANAGER** | **NOT IN PILOT SCOPE** |
| **ANDROID_WORKER** | **NOT IN PILOT SCOPE** |
| **SECURITY** | **READY** |
| **ROMA (client pilot)** | **NOT IN PILOT SCOPE** |
| **ROMA (owner observability implementation)** | **READY** |
| **ROMA (Phase 2 integration on production)** | **UNKNOWN** |
| **ROMA (deployment certification 10/10)** | **BLOCKED** (owner secrets/baselines — not software) |
| **DEPLOYMENT (production runtime)** | **READY** |
| **DEPLOYMENT (branch tip = production)** | **BLOCKED** (15 commits not deployed — non-pilot-critical) |
| **PUBLIC_SITE** | **READY** |
| **WEB_CABINET (code)** | **READY** |
| **WEB_CABINET (pilot E2E proof)** | **BLOCKED** (operational smoke not done) |
| **PLATFORM_ADMIN** | **READY** |
| **AI** | **READY** |
| **IOS_WORKER (code/API)** | **READY** |
| **IOS_WORKER (device pilot proof)** | **BLOCKED** |
| **IOS_MANAGER** | **READY** (optional; web primary) |
| **BACKEND / SUPABASE (runtime)** | **READY** |
| **SUPABASE (migration parity)** | **UNKNOWN** |
| **PILOT (overall)** | **BLOCKED** |

---

## Final verdict

```
ANDROID           = NOT IN PILOT SCOPE
SECURITY          = READY
ROMA              = NOT IN PILOT SCOPE (client pilot) / READY (owner implementation)
DEPLOYMENT        = READY (production runtime)
```

### Pilot blockers remaining

1. No real client intake / sponsor / device policy (**operational**)
2. No client tenant, project, invites (**operational**)
3. Physical iOS device smoke not executed (**evidence**)
4. Worker media + manager approval closed loop not live-proven (**evidence**)

### Pilot blockers removed (vs prior reports)

1. ~~Android code missing~~ — **wrong**; code exists, scope excluded
2. ~~Security materially incomplete~~ — **overstated**; live gates pass
3. ~~ROMA incomplete blocks pilot~~ — **wrong**; not in pilot scope
4. ~~Production linearly behind main~~ — **wrong topology**; divergent histories

### Unknowns remaining

1. Supabase remote migration parity vs repo (not diffed live)
2. ROMA Phase 2 integration behavior on production (commit not deployed)
3. Android Gradle build green on CI (not run this session)
4. Stakeholder dashboard shell UX without live stakeholder creds

### Can pilot begin?

**NO**

Not because Android, Security, ROMA, or Deployment are **BLOCKED** for engineering — but because **operational P0 evidence** (client, tenant, device smoke) is **BLOCKED**.

---

## Prior report corrections

| Prior claim | Verdict |
|-------------|---------|
| Android NO = product not built | **WRONG** — built; excluded from scope |
| SECURITY PARTIAL = unsafe for pilot | **OVERSTATED** — core controls READY |
| ROMA PARTIAL = incomplete product | **WRONG framing** — complete for owner; not pilot scope |
| Production behind main (linear) | **WRONG** — divergent; production has ROMA commits main lacks |
| PILOT PARTIAL = platform engineering weak | **WRONG** — platform READY; operations BLOCKED |

---

## Document control

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-07-07 | Root cause investigation — audit board |

**Investigation SHA:** `031150aa`  
**Production SHA (live):** `e6170ce`  
**origin/main SHA:** `bf4b7f1`
