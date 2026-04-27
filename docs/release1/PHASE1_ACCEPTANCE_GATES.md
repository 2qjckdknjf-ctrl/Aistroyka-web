# PHASE 1 — Release 1 acceptance gates

**Purpose:** **Hard stops** before implementation starts and **between waves**. Each gate is **pass/fail**. **Failure blocks progression** until resolved or scope is formally changed with a new Phase 1 revision.

---

## Gate G0 — iOS build / source-of-truth

| Field | Specification |
|-------|----------------|
| **Evidence required** | Successful **command or CI job** documented in repo or runbook: e.g. `xcodebuild -scheme AiStroykaWorker` / `AiStroykaManager` with agreed SDK; **or** explicit CI workflow name + link. **Projects in repo:** `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj`, `ios/AiStroykaManager/AiStroykaManager.xcodeproj`. |
| **Failure** | Cannot produce `.ipa` or simulator build **from clean checkout** using documented steps. |
| **Blocks** | Wave 3–4 iOS work; **cannot** claim iOS in R1 DoD. |
| **Notes** | **`xcuserdata`** in repo (e.g. under Worker `.xcodeproj`) is a **hygiene smell** — gate should prefer **shared schemes** and CI that do not depend on one machine. |

---

## Gate G1 — Android build / test truth

| Field | Specification |
|-------|----------------|
| **Evidence required** | Documented `./gradlew :AiStroykaWorker:assembleRelease` (or agreed variant) **green** from clean checkout + `local.properties`/secrets instructions; **optional** but recommended: at least **one** JVM or instrumented test task for regression on `shared` API mapping. |
| **Failure** | Debug-only build works but **release** cannot be built; or Gradle sync fails without undocumented steps. |
| **Blocks** | Wave 3–4 Android work. |

---

## Gate G2 — CI truth

| Field | Specification |
|-------|----------------|
| **Evidence required** | Written list: which workflows in **root** `.github/workflows` are **authoritative** for `main`; whether `apps/web/.github/workflows/ci.yml` is active; **minimum** green: `lint`, `test`, `cf:build` (or agreed subset) on PR to `main`. |
| **Failure** | Duplicate/conflicting CI with no owner; merges without verifiable automation. |
| **Blocks** | Wave 7 release proof. |

---

## Gate G3 — auth / tenant / role

| Field | Specification |
|-------|----------------|
| **Evidence required** | Matrix: for `owner`, `admin`, `member`, `viewer` — **first protected web route** + **key** `/api/v1` call succeeds with correct **403** when out of role. **Mobile:** Bearer without cookie succeeds for allow-listed routes + correct `x-client`. |
| **Failure** | Any role sees **cross-tenant** data, or mobile gets **401/403** on worker route due to wrong Supabase client choice. |
| **Blocks** | All waves after Wave 1. |

---

## Gate G4 — worker proof (reference)

| Field | Specification |
|-------|----------------|
| **Evidence required** | One **full** chain: create report → upload media → finalize → add-media → **submit** → `GET /api/v1/reports/:id` shows **submitted** (or later state). **Reference proof MUST NOT** rely on **`PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO`** / **debug-only** bypass on Android. **Artifacts:** report UUID, timestamps, storage object path if applicable. |
| **Failure** | Proof only possible with debug bypass; or upload RLS failures on production rules. |
| **Blocks** | Wave 4+; **F4** incomplete. |

---

## Gate G5 — manager review

| Field | Specification |
|-------|----------------|
| **Evidence required** | From **Manager** surface (web or mobile): **approve**, **reject**, and **request changes** each exercised at least once on **test tenant** (or **approve + one** other if product simplifies — **must be explicit in scope addendum**). API read-back matches UI. |
| **Failure** | Review PATCH succeeds but **progress/owner** views do not reflect truth. |
| **Blocks** | Wave 5–6; **F5–F6** incomplete. |

---

## Gate G6 — client visibility

| Field | Specification |
|-------|----------------|
| **Evidence required** | **Web owner** path: user with **client-appropriate** role sees **progress + updates + photos** + **decision** UI defined in scope. **iOS Client + Android Client:** **only after** apps exist — same minimums **read-first** + **decision** actions allowed by API. |
| **Failure** | Owner sees empty state when data exists; or decisions **only** available to internal roles — contradicts R1 §C. |
| **Blocks** | R1 closure for **nine surfaces**. |

---

## Gate G7 — no-regression

| Field | Specification |
|-------|----------------|
| **Evidence required** | Agreed **Vitest** suite + **Playwright** smoke paths (`apps/web/tests/e2e/*.spec.ts` as selected) **green**; **no new** unhandled 5xx on smoke URLs; **Maestro** pilot flows **green** on CI or nightly if adopted. |
| **Failure** | Flaky or red mainline with no waiver owner. |
| **Blocks** | Wave 7 completion. |

---

## Gate G8 — release readiness

| Field | Specification |
|-------|----------------|
| **Evidence required** | Production deploy matches **build stamp**; `docs/ENVIRONMENT-VARIABLES.md` (or successor) variables set; rollback owner named; **P0** monitoring path for **worker/media/report** errors. |
| **Failure** | Cannot redeploy prior known-good artifact; secrets missing. |
| **Blocks** | Ship decision. |

---

## Gate G9 — mandatory gap disclosure (non-technical)

| Field | Specification |
|-------|----------------|
| **Evidence required** | Signed product decision for any **waiver** of Worker **video / voice / comment / tri-state** if not implemented by gate date (per `PHASE1_FINAL_SCOPE.md` §F). |
| **Failure** | Silent omission of business-required row from §C functional minimums. |
| **Blocks** | Claiming R1 complete. |

---

## Summary: progression map

```
G0 iOS build ──┐
G1 Android build ──┤
G2 CI truth ───────┴──► G3 auth/tenant/role ──► G4 worker proof ──► G5 manager review ──► G6 client visibility ──► G7 regression ──► G8 release
                                                                      ▲
                                                              G9 waivers (parallel)
```

---

**STOP** — Implementation begins only after **G0–G2** and **G3** minima are planned with owners; **G4–G6** close **Release 1 definition of done**.
