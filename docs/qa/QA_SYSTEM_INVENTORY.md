# AISTROYKA QA System Inventory

**Generated:** 2026-07-03  
**Scope:** `apps/web`, API, auth, middleware, AI, CI, Supabase  
**Purpose:** Authoritative discovery baseline for the automated QA platform (`scripts/qa/`, `apps/web/tests/qa/`)

---

## 1. Discovered Architecture

### 1.1 Runtime topology

| Layer | Technology | Canonical URL |
|-------|------------|-----------------|
| Web app | Next.js 15 App Router, OpenNext on Cloudflare Workers | `https://aistroyka.ai` (prod), `https://staging.aistroyka.ai` (staging) |
| Database / Auth | Supabase project **AISTROYKA** (`vthfrxehrursfloevnlp`, eu-central-1) | — |
| AI runtime | `apps/web` only (`lib/platform/ai/`, `lib/copilot/`, `lib/ai-brain/`) | `/api/v1/ai/*`, project copilot SSE |
| Mobile sync | Lite client headers (`ios_lite`, `android_lite`, `ios_worker`, `android_worker`) | `/api/v1/worker/*`, `/api/v1/sync/*` |

### 1.2 App Router (105 `page.tsx` routes)

| Route group | Path prefix | Count | Purpose |
|-------------|-------------|-------|---------|
| **Public** | `/[locale]/(public)/` | 26 pages | Marketing, docs, pricing, contact |
| **Auth** | `/[locale]/(auth)/` | 4 | login, register, telegram |
| **Dashboard** | `/[locale]/(dashboard)/dashboard/` | ~40 | Contractor ops (projects, tasks, reports, AI, settings) |
| **Admin** | `/[locale]/(dashboard)/admin/` | 14 | Tenant company admin (owner/admin only) |
| **Portal** | `/[locale]/(dashboard)/portal/` | 2 | Stakeholder / client portal |
| **Owner** | `/[locale]/(owner)/owner/` | 1 | Platform owner cabinet (grant-gated) |
| **Standalone** | `/[locale]/` | 4 | invite/accept, subscribe, smoke, share/proof |

**Locales:** `ru` (default), `en`, `es`, `it` via `next-intl`.

### 1.3 API surface (287 `route.ts` handlers)

| Domain | v1 routes (approx) | Notes |
|--------|-------------------|-------|
| projects | 77 | CRUD, defects, documents, estimates, change-orders, copilot, costs |
| admin | 38 | billing pilot, jobs, leads, metrics, SLO, flags |
| ai | 17 | analyze-image, transcribe, memory, evals, copilot stream |
| portal | 11 | stakeholder project views |
| owner | 10 | platform diagnostics, tenants, support |
| worker | 8 | day start/end, report create/submit, sync |
| billing | 8 | checkout, portal, Stripe webhooks |
| sync | 3 | bootstrap, changes, ack |
| legacy (non-v1) | 27 | `/api/auth/*`, `/api/ai/*`, `/api/health` |

### 1.4 Middleware gates

**File:** `apps/web/middleware.ts`

| Gate | Behavior |
|------|----------|
| Session refresh | Supabase cookies via `lib/supabase/middleware.ts` |
| Protected pages | `/dashboard`, `/portal`, `/projects`, `/billing`, `/admin`, `/portfolio`, `/subscribe` → login redirect |
| Lite client | `x-client: ios_lite\|android_lite\|…` → 403 unless path on `lib/api/lite-allow-list.ts` |
| Owner API/pages | `/api/v1/owner/*`, `/owner/*` → `gateOwnerRequest()` |
| Security headers | `lib/security-headers.ts` on pages + `/api/v1/*` |

### 1.5 RBAC model

**Tenant roles** (`lib/tenant/tenant.policy.ts`): `owner > admin > member > viewer` + `stakeholder` (portal-only).

**Enterprise authz** (`lib/authz/`): OWNER, MANAGER, WORKER, CONTRACTOR with scoped permissions.

**Platform owner:** separate grant system — not tenant RBAC (`lib/platform-owner/`).

### 1.6 AI modules

| Entry | Path | Service |
|-------|------|---------|
| Vision | `/api/v1/ai/analyze-image` | `lib/platform/ai/ai.service.ts` |
| Copilot SSE | `/api/v1/projects/[id]/copilot/chat/stream` | `lib/copilot/copilot.service.ts` |
| Intelligence | `/api/v1/projects/[id]/intelligence` | `lib/ai-brain/` |
| Help assistant | `/api/v1/help/assistant` | in-app help SSE |
| Live gate | `scripts/smoke/ai_live_provider.sh --require-live` | canonical live LLM proof |

---

## 2. Available Test Modules

### 2.1 Unit tests (Vitest)

- **Count:** 301 `*.test.ts` files in `apps/web`
- **Config:** `apps/web/vitest.config.ts`
- **Run:** `bun run test` (root) or `bun run --cwd apps/web test`
- **Coverage areas:** authz, tenant guards, lite allow-list, AI providers/fallback, billing, sync, portal API, domain services

### 2.2 Playwright E2E (legacy pilot suite)

- **Config:** `apps/web/playwright.config.ts`
- **Dir:** `apps/web/tests/e2e/` (8 specs)
- **CI pilot:** `e2e:pilot` — `core-flow`, `sync-contract`, `dashboard-button-audit`
- **Helpers:** `_helpers/auth.ts`, `_helpers/routes.ts`, `audit-helpers.ts`

### 2.3 QA Platform (new)

- **Config:** `apps/web/playwright.qa.config.ts`
- **Dir:** `apps/web/tests/qa/` (phases 3–16)
- **Orchestrator:** `scripts/qa/run-qa-platform.sh` (docs previously referenced a non-existent `run-qa-platform.mjs`; Phase 3A corrected this inventory note)
- **Phase 3A credential-free public/auth entry:** `bun run --cwd apps/web e2e:phase3a` (`playwright.phase3a.config.ts`, `tests/phase3a/`)
- **Phase 3B authenticated dashboard/tenant-admin:** `bun run --cwd apps/web e2e:phase3b` (runs `tests/phase3b/preflight.mjs` first; exit 2 = `BLOCKED_EXTERNAL` when admin + non-admin credential pairs are incomplete)

- **Self-audit:** `scripts/qa/self-audit.mjs`
- **Reports:** `docs/qa/reports/` (generated)

### 2.4 Shell smokes

| Script | Purpose |
|--------|---------|
| `scripts/smoke/pilot_launch.sh` | Post-deploy health, cron, ops/metrics |
| `scripts/smoke/ai_live_provider.sh` | Live AI without fallback |
| `scripts/smoke/security_headers.sh` | CSP/HSTS on public routes |
| `scripts/smoke/ai_copilot_stream.sh` | Copilot SSE smoke |
| `scripts/verify/stakeholder_finance_sanity.sh` | Finance isolation denylist |

### 2.5 Audit orchestrators

| Script | Purpose |
|--------|---------|
| `scripts/audit/run-pilot-audit.sh` | Full local pilot audit |
| `scripts/audit/run_e2e_audit.sh` | Broader E2E audit |
| `scripts/release-readiness-check.mjs` | Policy/env readiness (CI) |

---

## 3. Missing / Incomplete Modules

| Gap | Status | Impact |
|-----|--------|--------|
| Multi-role E2E credential matrix | **MISSING** — only single `E2E_EMAIL` today | Role isolation untested in Playwright |
| Stakeholder portal Playwright flows | **MISSING** — curl denylist only | Client finance isolation partial |
| Visual regression baseline store | **NOT INITIALIZED** | Design QA needs first baseline run |
| Performance budgets in CI | **MISSING** | No LCP/CLS gate |
| `@axe-core/playwright` a11y | **OPTIONAL** — basic checks implemented without axe | Full WCAG scan unavailable |
| API contract OpenAPI CI | **MISSING** | Schema drift undetected |
| Cross-locale E2E matrix | **PARTIAL** — single locale per run | i18n regressions possible |
| PR preview environment | **MISSING** | Staging doubles as pre-prod |
| Unified QA dashboard UI | **MISSING** — markdown/JSON reports only | Operator visibility limited |
| Android E2E in web deploy chain | **MISSING** | Mobile disconnected |
| DB consistency E2E | **PARTIAL** — unit tests only | Optimistic update races untested live |
| Foreman-specific role | **NOT MODELED** — maps to `admin`/`member` in DB | No distinct foreman role in tenant policy |

---

## 4. Critical User Journeys

| ID | Journey | Roles | Surfaces | QA coverage |
|----|---------|-------|----------|-------------|
| J1 | Public discovery → contact/login | Guest | Public pages | `tests/qa/01-public-website.spec.ts` |
| J2 | Email login → dashboard | Member+ | Auth, dashboard | `tests/qa/02-auth.spec.ts` |
| J3 | Worker report create → manager sees report | Worker, Manager | API + dashboard | `tests/e2e/core-flow.spec.ts` |
| J4 | Project navigation no 500s | Manager | Dashboard | `tests/e2e/audit-dashboard-navigation.spec.ts` |
| J5 | Mobile sync bootstrap/changes/ack | Worker (lite) | API | `tests/e2e/sync-contract.spec.ts` |
| J6 | Copilot stream (live) | Manager | API SSE | `scripts/smoke/ai_copilot_stream.sh` |
| J7 | Stakeholder portal — no internal costs | Stakeholder | Portal API | `stakeholder_finance_sanity.sh` (prod gate) |
| J8 | Admin billing/jobs | Owner/Admin | Admin | Vitest + partial nav audit |
| J9 | Platform owner diagnostics | Platform owner | `/owner`, `/api/v1/owner/*` | **UNTESTED E2E** |
| J10 | Invite accept → tenant membership | Invited user | invite flow | **UNTESTED E2E** |
| J11 | Proof pack public share | Guest | `/share/proof/[token]` | Vitest route test only |
| J12 | Release deploy smoke | CI | staging → prod | `pilot-smoke.yml` |

---

## 5. Required Test Users

| Persona | Env vars | DB role | Notes |
|---------|----------|---------|-------|
| **Pilot smoke user** | `E2E_EMAIL` / `E2E_PASSWORD`, `PILOT_E2E_*` (CI) | owner or admin | Primary authenticated E2E; needs tenant + project |
| **Worker (lite)** | Same session + `x-device-id` | member | Worker API routes via lite header |
| **Stakeholder** | `STAKEHOLDER_SMOKE_EMAIL` / `STAKEHOLDER_SMOKE_PASSWORD` | stakeholder | Finance isolation crawl; dedicated account |
| **Platform owner** | `QA_PLATFORM_OWNER_EMAIL` / `QA_PLATFORM_OWNER_PASSWORD` | platform grant | **Not provisioned by default** |
| **Multi-role matrix** | `QA_OWNER_*`, `QA_MANAGER_*`, `QA_WORKER_*`, `QA_CLIENT_*` | per role | **Optional; tests skip when absent** |

**Fixture scripts:** `scripts/smoke/bootstrap_smoke_user.mjs`, `seed_pilot_project.mjs`, `attach_smoke_user_tenant.mjs`

---

## 6. Environments

| Environment | URL | Use |
|-------------|-----|-----|
| Local dev | `http://localhost:3000` (or 3001) | Developer QA, `bun run dev` |
| Staging | `https://staging.aistroyka.ai` | Pre-prod, deploy gate, E2E target |
| Production | `https://aistroyka.ai` | Post-deploy smoke, finance sanity |
| CI (PR) | No live URL — `cf:build` only | Unit + bundle gate |
| CI (staging deploy) | `PILOT_E2E_BASE_URL` secret | Playwright pilot (optional) |

**Health proof:** `GET /api/v1/health` → `buildStamp.sha7`

---

## 7. Secrets & Configuration

| Secret / env | Required for | Source |
|--------------|--------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Build + runtime | `.env.local`, CF secrets |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Build + runtime | `.env.local`, GitHub secrets |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin routes, proof pack, seeds | `.env.local` (never commit) |
| `E2E_EMAIL` / `E2E_PASSWORD` | Authenticated Playwright | `.env.pilot`, `.env.e2e` |
| `PILOT_SMOKE_BEARER_*` | Post-deploy HTTP smoke | GitHub secrets |
| `PILOT_E2E_*` | CI Playwright against staging | GitHub secrets |
| `STAKEHOLDER_SMOKE_*` | Finance isolation gate | Owner-provisioned |
| `CRON_SECRET` | Cron tick smoke | Production Worker secret |
| `OPENAI_API_KEY` / provider keys | Live AI gate | CF Worker secrets |
| `GITHUB_REVIEWER_TOKEN` | PR merge (non-QA) | `.env.local` |

**Templates:** `.env.pilot.example`, `.env.e2e.example`, `.env.qa.example` (new)

---

## 8. CI Readiness

### 8.1 Existing gates

| Gate | Workflow | Blocking? |
|------|----------|-----------|
| Install, i18n, lint, tsc, vitest, cf:build | `ci-check.yml` | **YES** (PR) |
| Post-deploy HTTP smoke | `pilot-smoke.yml` | **YES** (staging + prod) |
| Playwright pilot (3 specs) | `pilot-e2e-audit.yml` | **YES** if secrets present; else **SKIP** |
| Stakeholder finance sanity | prod deploy workflow | **YES** (prod) |
| Security headers | prod deploy workflow | **YES** (prod) |
| AI live provider | deploy workflows | **NO** (`continue-on-error`) |
| iOS UITest smoke | `ios-ui-smoke.yml` | **YES** (iOS PRs) |

### 8.2 QA platform CI (new)

| Gate | Workflow | Trigger |
|------|----------|---------|
| QA public + auth + security (no creds) | `qa-platform.yml` | PR, nightly, manual |
| QA full suite (with creds) | `qa-platform.yml` | manual, nightly staging |
| Self-audit coverage report | `qa-platform.yml` | always |
| Release verdict JSON | `scripts/qa/generate-reports.mjs` | end of QA run |

### 8.3 CI readiness verdict

| Item | Status |
|------|--------|
| PR unit + build gate | **READY** |
| Staging deploy smoke | **READY** |
| Playwright in CI | **CONDITIONAL** — secrets-dependent |
| Full QA platform in CI | **PARTIAL** — public/unauth phases ready; role/business need creds |
| Nightly staging QA | **READY** (workflow added; needs secrets for full pass) |
| Artifact upload (HTML, JUnit, traces) | **READY** (qa-platform workflow) |

---

## 9. Customer Finance Isolation (QA constraint)

Per mega-roadmap: customer/stakeholder surfaces must **never** expose internal costs, margin, subcontractor prices, or internal budget pressure. QA must verify:

- Portal API responses denylisted paths (`stakeholder_finance_sanity.sh`)
- Playwright portal tests must not assert on internal cost fields
- AI copilot must not leak tenant A data to tenant B (tested in `tests/qa/07-ai-validation.spec.ts` when creds present)

---

## 10. Quick Reference Commands

```bash
# Discovery + self-audit (no server required)
bun run qa:self-audit

# Full QA platform (loads .env.qa if present)
bun run qa:platform

# Public/unauth only (CI-safe)
bun run qa:public

# Release verdict
bun run qa:release

# Legacy pilot E2E
bun run --cwd apps/web e2e:pilot
```

---

*This inventory is the Phase 1 discovery artifact. Re-run `scripts/qa/route-discovery.mjs` after major route additions to refresh counts.*
