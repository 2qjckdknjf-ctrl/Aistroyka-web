# PLATFORM INTEGRATION TRUTH MATRIX

**Audit date:** 2026-04-02 (UTC)  
**Evidence basis:** repository inventory, `npm run build` (root), `npm test` (`apps/web`), production `GET https://aistroyka.ai/api/health` (read-only), staged launch docs (`docs/launch/STAGE4_*`), source review of middleware, `lite-allow-list`, iOS/Android API clients.

**Status vocabulary:** DONE | PARTIAL | BROKEN | STUB | STALE_DOC | UNKNOWN | BLOCKER | ACTIVE

| Surface | Scope (what exists in repo) | Repo proof | Build proof | Runtime proof | Dependencies | Parity gaps | Risks | Blockers | Status |
|--------|------------------------------|------------|-------------|---------------|--------------|-------------|-------|----------|--------|
| **Public Site** | ~40+ localized public routes under `apps/web/app/[locale]/(public)/` (marketing, pricing, contact, workflows, enterprise, ai-demo, copilot, docs, cases, etc.) | **ACTIVE** — pages and messages in `messages/*.json` | **DONE** — Next.js production build succeeded | **PARTIAL** — health OK; **no** automated claim-vs-code matrix for every CTA | Next.js, next-intl | Marketing breadth **>** mobile pilot evidence | Public copy may outpace what was proven on devices | None for “site loads” | **PARTIAL** |
| **Web Manager** | Dashboard, projects, tasks, reports, team, notifications, approvals, AI surfaces, admin subsets | **ACTIVE** | **DONE** | **PARTIAL** — E2E not run in this audit; flows covered heavily by Vitest | Supabase session, tenant context | Some dashboard modules (portfolio, governance, billing) vs mobile depth | Role/tenant bugs surface as 403/401; large surface area | Tenant membership required for tenant-scoped ops | **PARTIAL** |
| **Web Owner/Client** | Stakeholder/client routes: `dashboard/projects/[id]/client/*`, client portal APIs, invites | **ACTIVE** | **DONE** | **UNKNOWN** — not exercised live here | Stakeholder policies, RLS | Mobile has **no** separate “client app” | Misconfiguration of stakeholder role gates | None proven in-session | **PARTIAL** |
| **Backend/API** | **196** `route.ts` handlers under `apps/web/app/api/` | **ACTIVE** | **DONE** (compile + tests) | **PARTIAL** — route tests + read-only health; not every route hit live | Supabase, service role for jobs | Lite clients restricted by middleware | `x-client` bypass only for lite profiles; mis-set headers confuse integrators | None for build | **PARTIAL** |
| **DB/Tenant/Roles** | `lib/tenant/*`, `lib/authz/*`, RLS tests, repositories | **ACTIVE** | **DONE** (policy/unit tests) | **PARTIAL** — live DB not mutated in this audit | Supabase Postgres + RLS | Docs in `docs/release-audit/*` may lag repo | JWT valid but **no tenant membership** → 403 (per prior pilot notes) | Tenant onboarding / membership for smoke users | **PARTIAL** |
| **iOS Worker** | `ios/AiStroykaWorker`, `ios/Shared` — WorkerAPI, sync, upload sessions, submit | **ACTIVE** | **UNKNOWN** — `xcodebuild` not run in this session | **PARTIAL** — `docs/launch/STAGE4_CROSS_PLATFORM_TRUTH_MATRIX.md`: **iOS E2E not proven**; upload path fix documented | Supabase auth, Bearer, `x-client: ios_lite` | Parity with Android pilot evidence | App Store / APNS / provisioning not validated here | iOS Maestro/device proof open per STAGE4 doc | **PARTIAL** |
| **iOS Manager** | `ios/AiStroykaManager` — ManagerAPI (`ios_manager` profile), reports, review PATCH | **ACTIVE** | **UNKNOWN** | **PARTIAL** — not proven E2E in STAGE4 matrix | Same + manager routes | Web dashboard deeper than mobile manager | Same as Worker for release | iOS runtime proof gap | **PARTIAL** |
| **Android Worker** | `android/AiStroykaWorker`, shared `ApiClient` (`android_lite`) | **ACTIVE** | **UNKNOWN** — Gradle not run in this session | **PARTIAL** — STAGE4 matrix: Maestro **PASS** + report UUID evidence **2026-03-25** | Supabase, lite allow list | Debug pilot flags noted in STAGE4 (`PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO`) — release vs pilot | HTTP/1.1 workaround for emulators (comment in `ApiClient.kt`) | Proof age / environment-specific | **PARTIAL** |
| **Android Manager** | `android/AiStroykaManager` | **ACTIVE** | **UNKNOWN** | **PARTIAL** — STAGE4: Maestro **PASS** approve flow on same report UUID | Same | Web still richer | Same | Same | **PARTIAL** |
| **Notifications** | `GET/PATCH /api/v1/notifications`, unread count, domain repo tests | **ACTIVE** | **DONE** | **PARTIAL** — list/read not exercised live here | DB tables, tenant user | Push delivery (APNs/FCM) depends on device registration | Worker vs manager notification product split | None for API compile | **PARTIAL** |
| **Media** | Upload sessions create/finalize, storage, report media linkage | **ACTIVE** | **DONE** (upload-session tests) | **PARTIAL** — Android/iOS flows depend on tenant-scoped paths (STAGE4 notes) | Supabase storage RLS | Client path bugs historically caused RLS failures | Wrong `upload_path` → RLS errors | None for unit/route tests | **PARTIAL** |
| **AI/Jobs** | Copilot stream, project AI routes, `cron-tick`, job handlers, analysis routes | **ACTIVE** | **DONE** | **PARTIAL** — production health: `"aiConfigured":false` **2026-04-02** | Provider keys, queues | Health flag may not equal “no AI anywhere” but is **runtime fact** | Cost, provider outages | Provider/env configuration in prod | **PARTIAL** |
| **Ops/Health** | `/api/health`, `/api/v1/ops/metrics` (tenant), admin cron | **ACTIVE** | **DONE** (tests for metrics route) | **PARTIAL** — health **200** via redirect; metrics **not** called with tenant JWT here | Cron secrets, Vercel/CF schedules | Dual deploy paths (Vercel + Cloudflare) documented historically | Wrong cron auth or missing secret | Authenticated smoke not re-run in this audit | **PARTIAL** |

---

## Build evidence (this audit)

- **Command:** `npm run build` from repo root (after `nvm use 20`).  
- **Result:** **SUCCESS** — Next.js **15.5.12**, contracts `tsc` OK, app build completed.

## Test evidence (this audit)

- **Command:** `npm test` in `apps/web`.  
- **Result:** **SUCCESS** — **219** test files, **1245** tests passed.

## Live evidence (read-only)

- **Command:** `curl -L https://aistroyka.ai/api/health`  
- **Result:** HTTP 200 JSON body includes `ok: true`, `buildStamp.sha7` (e.g. `6d03c7e` at time of check), `aiConfigured: false`, `openaiConfigured: true`.
