# PHASE 0 — Repository truth audit (repo-first)

**Date:** 2026-03-26 (UTC)  
**Scope:** Full monorepo inventory as it exists on disk. Documentation is **not** authoritative; this file prefers paths and configs.

---

## 1. Monorepo layout (proof)

| Area | Path | Notes |
|------|------|--------|
| **Root workspace** | `package.json` | `workspaces`: `apps/web`, `packages/contracts`, `packages/contracts-openapi`. **Not** listing `packages/api-client`. |
| **Web app** | `apps/web/` | Next.js App Router, `middleware.ts`, `app/` routes and pages. |
| **Contracts** | `packages/contracts/` | Zod + built `dist`; depended on by `apps/web` (`@aistroyka/contracts`). |
| **OpenAPI** | `packages/contracts-openapi/` | Present in workspace. |
| **Optional API SDK** | `packages/api-client/` | `package.json` states *“not used by apps/web at runtime”*. |
| **Android** | `android/` | Gradle project `AiStroyka` — `settings.gradle.kts` includes `:AiStroykaManager`, `:AiStroykaWorker`, `:shared`. |
| **iOS sources** | `ios/` | `ios/Shared/Package.swift` defines SwiftPM **Shared** library; app sources under `ios/AiStroykaWorker/`, `ios/AiStroykaManager/`. |
| **Maestro** | `maestro/flows/*.yaml`, `maestro/README.md` | Pilot flows for Android + iOS. |
| **Scripts** | `scripts/` | Smoke, pilot, release checks, Maestro runner (`scripts/maestro/run_stage4_pilot.sh`). |
| **Supabase migrations** | `apps/web/supabase/migrations/` | **68** `.sql` files (counted via glob). |
| **Docs** | `docs/` | Large tree (1000+ files); launch program under `docs/launch/`. |
| **Embedded product (non-primary)** | `paperclip/` | Separate npm workspace tree; treat as **out of Release 1** product surface unless explicitly in scope. |

**Build / PM:** Root specifies `packageManager`: `bun@1.2.15`; scripts use both `bun` and `npm run` patterns.

---

## 2. CI / CD (proof)

| Workflow | Path |
|----------|------|
| Deploy production (Cloudflare) | `.github/workflows/deploy-cloudflare-prod.yml` — push `main`, `bun install`, `cf:build`, Wrangler. |
| Staging deploy | `.github/workflows/deploy-cloudflare-staging.yml` |
| Pilot smoke | `.github/workflows/pilot-smoke.yml` |
| Migrations | `.github/workflows/apply-migrations.yml` |
| Snapshot backup | `.github/workflows/snapshot-backup.yml` |
| Lockfile | `.github/workflows/update-lockfile-linux.yml` |
| **Nested CI** | `apps/web/.github/workflows/ci.yml` — PR/push, `lint`, `test`, `cf:build`, Playwright e2e subset. |

**Implication:** Two CI definitions exist (root `.github` vs `apps/web/.github`); which runs depends on GitHub treating the repo root as the workflow location (verify in GitHub UI for this repo).

---

## 3. Web application — major truths

- **Framework:** Next.js 15, React 19 (`apps/web/package.json`).
- **Locales:** `middleware.ts` — `ru`, `en`, `es`, `it`; protected prefixes include `/dashboard`, `/projects`, `/billing`, `/admin`, `/portfolio`.
- **API surface:** **160** `route.ts` files under `apps/web/app/api` (counted 2026-03-26).
- **Lite mobile allow list:** `checkLiteAllowList` for `/api/v1` + `x-client` header (`middleware.ts` lines 45–50).
- **Tenant / auth:** `lib/tenant/` — `getTenantContextFromRequest`, roles `owner | admin | member | viewer`, RBAC hooks (`tenant.context.ts`, `tenant.types.ts`).

**Surface taxonomy (repo structure, not marketing names):**

| User-facing bucket | Route group | Examples |
|--------------------|-------------|----------|
| Public marketing | `[locale]/(public)/` | `pricing`, `features`, `contact`, … |
| Auth | `[locale]/(auth)/` | `login`, `register` |
| Authenticated product | `[locale]/(dashboard)/` | `dashboard/*`, `admin/*`, `projects/*`, `billing/*`, `team`, `portfolio` |

There is **no** separate deployable “Web Client app” — **owner / manager / admin** capabilities are expressed as **dashboard routes** and **API authorization**, not separate Next.js apps.

---

## 4. Backend / API — inventory style

- **Versioned API:** Dominant pattern `app/api/v1/**/route.ts` (reports, projects, tasks, worker, media, sync, billing, plan-fit, AI, admin, ops, notifications, …).
- **Legacy / parallel:** Some routes under `app/api/projects/`, `app/api/tenant/`, `app/api/health`, `app/api/system/*`, `app/api/_debug/*` — inventory shows mixed depth; consumers must map by path.
- **Domain code:** `apps/web/lib/domain/*`, `apps/web/lib/platform/*`, `apps/web/lib/ai-brain/*` (multi-phase AI brain), `apps/web/lib/supabase/*`.
- **Contracts:** Shared request/response validation via `@aistroyka/contracts` (Zod schemas referenced from routes).

**Tests:** **177** `*.test.ts` files under `apps/web` (glob); Vitest (`package.json` script `vitest run`).

---

## 5. iOS — major truths

- **Shared module:** SwiftPM `ios/Shared/Package.swift` — product **Shared**, iOS 16+.
- **Apps:** Source trees `ios/AiStroykaWorker/` and `ios/AiStroykaManager/` with SwiftUI views, `WorkerAPI` / `ManagerAPI`, operation queue, upload services.
- **Xcode project:** **No** `.xcodeproj` or `.xcworkspace` found in repository (glob **0**). **Risk:** IDE/project setup may live outside repo or in ignored files; not auditable here.

---

## 6. Android — major truths

- **Modules:** `AiStroykaWorker`, `AiStroykaManager`, `shared` (Kotlin).
- **Scale:** **18** `.kt` files total under `android/` (glob) — small surface; heavy logic in a few ViewModels + shared API layer.
- **Config:** `AiStroykaWorker/build.gradle.kts` — `BuildConfig.BASE_URL` `https://www.aistroyka.ai`, Supabase from `local.properties` / env; debug **`PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO`** unless `-PpilotRealSubmit=true`.
- **Tests:** No `testImplementation` / `androidTest` blocks found in `android/**/*.gradle.kts` (grep) — **automated Android tests not evidenced in repo**.

---

## 7. Cross-platform parity (high level)

| Concern | Web | iOS | Android |
|---------|-----|-----|---------|
| **Bearer + tenant API** | Yes (routes + server client) | `APIClient` + `AuthService` | `ApiClient` + `AuthService` in `shared` |
| **Worker report pipeline** | API routes `worker/report/*`, `media/upload-sessions/*` | `WorkerAPI`, queue, upload | `WorkerApi`, `WorkerViewModel` |
| **Manager review** | Dashboard + `PATCH` reports | `ManagerAPI` | `ManagerApi` |
| **Lite vs Manager client** | `x-client` + allow list | Profiles in Shared | `AppRuntime` / client profile strings in shared code |

**Parity is API-driven**; feature completeness differs per platform (see platform matrix doc).

---

## 8. Contradictions vs older docs (examples)

| Doc claim | Repo truth (2026-03-26) |
|-----------|-------------------------|
| `docs/launch/FIRST_CLIENT_SCOPE_LOCK.md` §4 table: Android **“None”** for photos + upload | **Contradiction:** `android/shared/WorkerApi.kt`, `WorkerViewModel.kt`, and Worker UI exist and call upload-session/report APIs. Table is **stale** relative to current Kotlin sources. |
| Some narratives imply **Vercel-only** deploy | **Contradiction:** Root workflows and `package.json` emphasize **Cloudflare Workers** + OpenNext (`cf:build`, `wrangler`). Treat **Cloudflare** as primary deploy path in repo; any Vercel doc may be historical. |

---

## 9. Classification summary (Release 1 lens)

| Layer | Status |
|-------|--------|
| **Web + API + DB migrations** | **READY / PARTIAL** — large implemented surface; some routes experimental (AI brain phases, billing pilot). |
| **Android** | **PARTIAL** — real apps + shared layer; debug pilot flags; no evidenced automated tests. |
| **iOS** | **PARTIAL** — substantial Swift code; **no Xcode project in repo**; build reproducibility unproven from files alone. |
| **paperclip/** | **EXISTS BUT OUT OF R1** — separate product tree unless business says otherwise. |

---

## 10. Safest next step (planning only)

Produce a **Release 1 slice document** that names: (1) exact web routes/screens in scope, (2) mobile targets (Android+iOS) with **proof of build** from CI or documented local steps, (3) mandatory API contract list from `packages/contracts`, (4) explicit **exclude** list (`lib/ai-brain` experimental phases, billing pilot admin, paperclip).

**Stop here for Phase 0 execution** — no implementation in this phase.
