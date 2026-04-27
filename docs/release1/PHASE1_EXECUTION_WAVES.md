# PHASE 1 — Release 1 execution waves (order only)

**No implementation in this document.** This is the **safest sequence** after scope freeze. Waves **cannot** be reordered downward (e.g. Worker wave before auth) without accepting re-work risk.

---

## Wave 0 — prerequisites / truth locks

| Field | Content |
|-------|---------|
| **Goal** | Establish **reproducible build**, **CI truth**, and **environment** baselines so later waves are measurable. |
| **Included surfaces** | Repo layout; Cloudflare/OpenNext deploy path; **iOS** Xcode schemes; **Android** Gradle; GitHub Actions inventory (root `.github` vs `apps/web/.github`). |
| **Dependencies** | None. |
| **Must be green** | Documented **single** source of truth for: production URL, Supabase project, secrets layout; **iOS** `xcodebuild` or CI job succeeds for Worker + Manager schemes; **Android** `assembleDebug` (or agreed task) succeeds; `bun install` + `bun run test` + `cf:build` policy agreed. |
| **Must not be touched** | Product domain logic; tenant middleware semantics. |

---

## Wave 1 — auth / tenant / role safety

| Field | Content |
|-------|---------|
| **Goal** | Lock **Bearer + cookie + RLS** behavior for **Worker/Manager/Client** API consumers; no drift in `getTenantContextFromRequest`. |
| **Included surfaces** | `lib/tenant/**`, `lib/supabase/**`, `createClientFromRequest` usage audit on routes used by mobile + owner; **lite allow list** alignment for `x-client` profiles (`ios_lite`, `android_lite`, `ios_manager`, `android_manager` — exact strings from code). |
| **Dependencies** | Wave 0 green. |
| **Must be green** | Acceptance gate: **auth/tenant/role** — documented matrix of roles vs **first API** each surface calls; smoke scripts (`scripts/smoke/pilot_launch.sh` etc.) pass on target env. |
| **Must not be touched** | Broad rewrite of middleware allow list keys; Stripe webhook. |

---

## Wave 2 — project / task / report / review backbone verification

| Field | Content |
|-------|---------|
| **Goal** | Prove **F2–F5** on **API + web manager** with **contracts** (`packages/contracts`) aligned. |
| **Included surfaces** | `v1/projects`, `v1/tasks`, `v1/worker/report/*`, `v1/media/upload-sessions/*`, `v1/reports` + PATCH review; Web Manager pages. |
| **Dependencies** | Wave 1 green. |
| **Must be green** | Gate: **worker proof** (server-side) + **manager review** (server-side) **using web or scripted API** before mobile claims. |
| **Must not be touched** | Upload session path semantics (prefix / tenant / session id); change only with defect ticket. |

---

## Wave 3 — worker completion (iOS + Android)

| Field | Content |
|-------|---------|
| **Goal** | Meet **Worker** minimums in `PHASE1_FINAL_SCOPE.md`: login, tasks, detail, report, media, submit, notifications, earnings light (if in contract), **tri-state** and **notes/media types** per §F (or signed waiver). |
| **Included surfaces** | `ios/AiStroykaWorker/**`, `android/AiStroykaWorker/**`, `shared` / `Shared`. |
| **Dependencies** | Wave 2 green. |
| **Must be green** | Gate: **worker proof** — **no Android debug photo bypass** in **reference** proof; **full** create → upload → finalize → attach → submit → API read-back; captures UUID + timestamps. |
| **Must not be touched** | Core upload-session service shape; lite allow list. |

---

## Wave 4 — manager completion (iOS + Android + Web parity check)

| Field | Content |
|-------|---------|
| **Goal** | Replace **iOS** placeholder tabs with real data **or** formally reduce visible tabs to match R1 (product decision — **not** silent); Android Manager feature-complete vs R1 minimums; Web Manager regression check. |
| **Included surfaces** | `ios/AiStroykaManager/**`, `android/AiStroykaManager/**`, Web Manager reports/tasks/projects/notifications. |
| **Dependencies** | Wave 3 produces submitted reports in env. |
| **Must be green** | Gate: **manager review** on device + API final state; notifications received where spec requires. |
| **Must not be touched** | Report review policy core in domain — **surgical** changes only. |

---

## Wave 5 — client completion (Web owner + new mobile clients)

| Field | Content |
|-------|---------|
| **Goal** | **Web Client / Owner** meets progress / feed / photos / decisions; **build** `AiStroykaClient` iOS + Android per **thin** scope §G `PHASE1_FINAL_SCOPE.md`. |
| **Included surfaces** | `OwnerViewClient`, related dashboards; **new** `ios/.../AiStroykaClient` + `android:AiStroykaClient` (names TBD). |
| **Dependencies** | Waves 3–4 green (data exists to show). |
| **Must be green** | Gate: **client visibility** — owner can see progress + act on **decision** items defined in scope. |
| **Must not be touched** | Admin billing pilot; ai-brain. |

---

## Wave 6 — notifications / earnings light / AI assist

| Field | Content |
|-------|---------|
| **Goal** | Wire **F7, F9, F10** to **narrow** definitions: earnings **read model** only; notifications **actionable**; AI **assist allow list** from `PHASE1_EXCLUDES.md`. |
| **Included surfaces** | `v1/notifications/**`, worker summary / project progress aggregation, **allowed** `/api/v1/ai/*` endpoints only. |
| **Dependencies** | Waves 2–5 green. |
| **Must be green** | Gate: earnings light visible per agreed spec; notifications route next step for at least **manager + worker**; AI outputs are **non-destructive** assists. |
| **Must not be touched** | Stripe webhook; broad ai-brain packages. |

---

## Wave 7 — stabilization / regression / release proof

| Field | Content |
|-------|---------|
| **Goal** | CI, e2e smoke, mobile Maestro (if in gate), production deploy checklist, rollback note. |
| **Included surfaces** | `.github/workflows`, `apps/web/tests/e2e`, `maestro/`, `docs/release1/` release checklist (to be created in later phase). |
| **Dependencies** | Waves 0–6 green. |
| **Must be green** | **No-regression** + **release readiness** gates. |
| **Must not be touched** | Anything not failing a gate — **freeze** code except hotfixes. |

---

**STOP** — Wave execution begins only after `PHASE1_ACCEPTANCE_GATES.md` is accepted.
