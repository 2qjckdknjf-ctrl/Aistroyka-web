# Admin Cabinet State Audit

**Date:** 2026-07-03  
**Auditor role:** Principal Product Auditor + Admin Platform Architect  
**Scope:** Read-only inventory of platform administrator surfaces; no implementation changes.

---

## 0. Git safety snapshot

| Field | Value |
|-------|-------|
| **pwd** | `/Users/alex/Projects/AISTROYKA` |
| **branch** | `feature/roma-qa-framework` |
| **SHA** | `01706f46a416dc9d8a28bb83f7574fbe28084783` |
| **status** | Dirty working tree (modified: `AGENTS.md`, `package.json`, `apps/web/package.json`; many untracked docs under `docs/launch/`, `docs/mobile/`, `docs/qa/`, `scripts/qa/`, etc.) |

No commits or pushes were made for this audit.

---

## 1. Executive summary

AISTROYKA has **two distinct administrator surfaces**, not one unified “platform admin cabinet”:

| Surface | Base path | Audience | Purpose |
|---------|-----------|----------|---------|
| **Tenant company admin** | `/[locale]/admin/*` | `tenant_members.role` ∈ `{owner, admin}` | Tenant-scoped ops: AI observability, jobs, leads, billing pilot, feature flags, operator workbench |
| **Platform owner cabinet** | `/[locale]/owner/*` | `platform_owner_grants` row (`OWNER`, `OWNER_OPERATOR`, `OWNER_READONLY`) | Cross-tenant metadata: tenants, users, support tickets, audit, diagnostics |

**Critical naming clarification:** `/admin` is **not** platform-wide administration. Contractor tenant owners/admins use it for their company’s operational control plane. True cross-tenant platform control lives under `/owner` with hardened middleware gates.

The tenant admin area is **substantial and largely functional**. The platform owner area is **functional but minimal** (single-page console, no sub-navigation). There is **no** Admin → Testing / ROMA section today. A separate QA scaffold exists in `docs/qa/`, `scripts/qa/`, and `apps/web/tests/qa/` but is **not wired into any admin UI**.

---

## 2. Discovered admin UI routes

### 2.1 Tenant admin (`apps/web/app/[locale]/(dashboard)/admin/`)

Guard: `admin/layout.tsx` → `requireAdmin()` redirects non-`owner`/`admin` users to `/[locale]/dashboard`.

| Route | Page file | UI classification | Notes |
|-------|-----------|-------------------|-------|
| `/admin` | `page.tsx` | **REAL_WORKING** | Hub: jobs table (server), `AdminProductControlCenterClient` (6 APIs), `AISystemHealth`, inline deep links |
| `/admin/governance` | `governance/page.tsx` | **REAL_WORKING** / **PARTIAL** | Server-rendered AI governance events, threshold history, calibration; empty states when tables sparse |
| `/admin/trust` | `trust/page.tsx` | **REAL_WORKING** / **PARTIAL** | AI trust daily indices, timeline, causal hints; data-dependent |
| `/admin/system` | `system/page.tsx` | **REAL_WORKING** / **PARTIAL** | `getSystemMetrics()` telemetry; graceful empty when metrics unavailable |
| `/admin/operator` | `operator/page.tsx` | **REAL_WORKING** | `OperatorWorkbenchClient`: diagnostics, smoke suite, cron triggers, flags, leads triage, incident resolution |
| `/admin/ai` | `ai/page.tsx` | **REAL_WORKING** | `AdminAiOverviewClient` — usage, breaker, issues, runtime panel |
| `/admin/ai/security` | `ai/security/page.tsx` | **REAL_WORKING** | Security events surface (linked from AI hub) |
| `/admin/ai/requests` | `ai/requests/page.tsx` | **REAL_WORKING** | Request ID explorer |
| `/admin/ai/guide` | `ai/guide/page.tsx` | **REAL_WORKING** | AI Guide analytics |
| `/admin/billing-pilot` | `billing-pilot/page.tsx` | **REAL_WORKING** | Internal billing cohort ops; requires service role for workspace list |
| `/admin/jobs` | `jobs/page.tsx` | **REAL_WORKING** | `AdminJobsClient` — failed/dead job queue management |
| `/admin/push` | `push/page.tsx` | **REAL_WORKING** | `AdminPushOutboxClient` — push outbox + test send |
| `/admin/leads` | `leads/page.tsx` | **REAL_WORKING** | Contact leads CRM-style triage |
| `/admin/leads/[id]` | `leads/[id]/page.tsx` | **REAL_WORKING** | Lead detail |

**Not under `/admin` but admin-adjacent:**

| Route | Classification | Notes |
|-------|--------------|-------|
| `/[locale]/team` | **REAL_WORKING** | Team invite/membership — tenant settings, not in admin nav |
| `/[locale]/dashboard/projects/[id]/owner` | **REAL_WORKING** | Project stakeholder/owner panel — project scope, not platform admin |

### 2.2 Platform owner (`apps/web/app/[locale]/(owner)/owner/`)

Guard: `(owner)/layout.tsx` → `assertPlatformOwnerPageAccess()` + middleware `gateOwnerRequest`.

| Route | Classification | Notes |
|-------|--------------|-------|
| `/owner` | **REAL_WORKING** / **PARTIAL** | Single `OwnerConsoleClient`: overview KPIs, tenant list, user list, support tickets + thread, audit tail, diagnostics. Minimal chrome (“Isolated control layer” header only). No sidebar or sub-routes. |

### 2.3 Navigation visibility gaps

| Location | What appears | Gap |
|----------|--------------|-----|
| `DashboardShell.tsx` sidebar | Only `/admin/push`, `/admin/jobs` when `isAdmin=true` | 12+ admin pages reachable only via hub inline links or direct URL |
| `Nav.tsx` (public/header) | `/admin` link | Does not enumerate sub-pages |
| Admin hub `page.tsx` | Links to governance, trust, operator, system, jobs, ai, leads | Billing-pilot, push not linked from hub |
| Owner console | No nav at all | Single-page only |

---

## 3. Discovered admin APIs

### 3.1 Tenant admin APIs (`/api/v1/admin/*`)

**Auth pattern (typical):** `getTenantContextFromRequest` → `requireTenant` → `requireAdmin(ctx, "read"|"write")` via `authorize(ctx, "admin:read"|"admin:write")`. Requires role ≥ `admin` (owner or admin).

| Path | Methods | Role | Tenant scope | UI exposed | Production safety |
|------|---------|------|--------------|------------|-------------------|
| `/api/v1/admin/leads` | GET | admin:read | tenant | Yes (`/admin/leads`, operator) | Safe — tenant RLS |
| `/api/v1/admin/leads/[id]` | GET, PATCH | read/write | tenant | Yes | Safe |
| `/api/v1/admin/leads/bulk` | POST | admin:write | tenant | Yes (operator) | Safe |
| `/api/v1/admin/alerts` | GET | admin:read | tenant | Yes (control center, operator) | Safe |
| `/api/v1/admin/alerts/[id]/resolve` | POST | admin:write | tenant | Yes (operator) | Safe |
| `/api/v1/admin/anomalies` | GET | admin:read | tenant | Yes | Safe |
| `/api/v1/admin/jobs` | GET | admin:read | tenant | Yes | Safe |
| `/api/v1/admin/jobs/cron-tick` | POST | **cron secret only** | **all tenants** | Yes (operator) | **Risk:** no tenant admin check; gated by `requireCronSecretIfEnabled` |
| `/api/v1/admin/jobs/schedule-reconcile` | POST | **cron secret only** | **all tenants** | Yes (operator) | **Risk:** same as cron-tick |
| `/api/v1/admin/audit-logs` | GET | admin:read | tenant | Yes (control center) | Safe |
| `/api/v1/admin/slo/overview` | GET | admin:read | tenant | Yes | Safe |
| `/api/v1/admin/slo/tenants/[tenantId]` | GET | admin:read | tenant | Partial (AI panel) | Safe if tenantId matches ctx |
| `/api/v1/admin/metrics/overview` | GET | admin:read | tenant | Internal | Safe |
| `/api/v1/admin/ops/diagnostics` | GET | admin:read | tenant | Yes (operator) | Safe |
| `/api/v1/admin/ops/ai-runtime` | GET | admin:read | tenant | Yes (AI runtime panel) | Safe |
| `/api/v1/admin/operator/context` | GET | admin:read | tenant | Yes (operator) | Safe |
| `/api/v1/admin/operator/smoke` | POST | admin:read | tenant | Yes (operator “Run smoke suite”) | Safe — read-only aggregation smoke |
| `/api/v1/admin/flags` | GET, POST | read/write | **global** `feature_flags` | Yes (operator) | **Risk:** tenant admin can mutate platform-wide flags via service role |
| `/api/v1/admin/tenants/[id]/flags` | POST | admin:write | tenant override | Yes (operator) | Safe for own tenant |
| `/api/v1/admin/push/outbox` | GET | admin:read | tenant | Yes (`/admin/push`) | Safe |
| `/api/v1/admin/push/test` | POST | admin:write | tenant | Yes (operator, push page) | Moderate — sends test push |
| `/api/v1/admin/billing/*` | various | admin:write | platform billing tables | Yes (billing-pilot) | **Risk:** powerful billing reprocess; admin:write not owner-only |
| `/api/v1/admin/ai/usage` | GET | admin:read | tenant | Yes (AI overview) | Safe |
| `/api/v1/admin/analytics/*` | GET | admin:read | tenant | Partial | Safe |
| `/api/v1/admin/security/posture` | GET | admin:read | tenant | Yes (AI security) | Safe |
| `/api/v1/admin/privacy/findings` | GET | admin:read | tenant | Partial | Safe |

**Not found in repo:** `/api/v1/admin/exports/*` (mentioned in prior exploration; no route files present).

### 3.2 Platform owner APIs (`/api/v1/owner/*`)

**Auth:** `requirePlatformOwnerApi(request, { mode: "read"|"write"|"critical" })` — grant in `platform_owner_grants`, session freshness, optional IP/host/secret headers, rate limits, tiered roles.

| Path | Mode | UI exposed | Notes |
|------|------|------------|-------|
| `/api/v1/owner/overview` | read | Yes | Tenant/user/invite/support counts |
| `/api/v1/owner/tenants` | read | Yes | Cross-tenant list |
| `/api/v1/owner/tenants/[tenantId]` | read | No dedicated UI | API exists |
| `/api/v1/owner/users` | read | Yes | Cross-tenant user memberships |
| `/api/v1/owner/audit` | read | Yes | Platform owner audit tail |
| `/api/v1/owner/diagnostics` | read | Yes | Auth/invite/mobile link diagnostics |
| `/api/v1/owner/health` | read | No UI | Owner-tier health |
| `/api/v1/owner/support/tickets` | read/write | Yes | Ticket list + status PATCH |
| `/api/v1/owner/support/tickets/[ticketId]/messages` | read/write | Yes | Thread + reply |
| `/api/v1/owner/critical/echo` | critical | No UI | Step-up HMAC required; OWNER role only |

### 3.3 Related ops / health APIs (not under `/admin`)

| Path | Auth | Admin UI | Notes |
|------|------|----------|-------|
| `GET /api/v1/health` | **Public** | No | `buildStamp`, DB/AI config — no secrets |
| `GET /api/v1/ops/metrics` | **Any tenant member** | No direct page | Tenant-scoped cockpit metrics; not admin-gated |
| `GET /api/v1/system/health` | varies | No | System health service checks |
| `GET /api/v1/owner/health` | platform owner | No | Owner-scoped |

### 3.4 QA / testing APIs

**None** under `/api/v1/admin` or `/api/v1/owner` for test orchestration, history, artifacts, or release gates. QA runs via CLI (`bun run qa:*`) and GitHub Actions (`.github/workflows/qa-platform.yml` — untracked on branch).

---

## 4. RBAC findings

### 4.1 Who can access admin cabinet today

| Actor | `/admin/*` | `/owner/*` | `/api/v1/admin/*` | `/api/v1/owner/*` |
|-------|------------|------------|-------------------|-------------------|
| Tenant `owner` | Yes | Only if separate `platform_owner_grants` row | Yes (read/write per action) | Only with platform grant |
| Tenant `admin` | Yes | No (unless also platform grant) | Yes | No |
| Tenant `member` / `viewer` | No (redirect) | No | 403 | No |
| Platform owner grant (`OWNER`, etc.) | Yes **if also** tenant admin in some tenant | Yes | Yes **in tenant context** | Yes |
| Stakeholder / portal | No | No | No | No |

### 4.2 Platform owner vs tenant owner distinction

- **Tenant owner** (`tenant_members.role = 'owner'`): highest role within one contractor company; billing actions require `billing:admin` (owner-only per `tenant.policy.ts`).
- **Platform owner** (`platform_owner_grants`): separate table and middleware gate; tiered roles (`OWNER`, `OWNER_OPERATOR`, `OWNER_READONLY`); not the same as tenant owner.
- **`platform_break_glass_grants`**: DB table exists for audited cross-tenant data access; **no UI surface found** in admin or owner cabinets.

### 4.3 Platform admin role readiness

There is **no** role named `platform_admin`. Platform administration uses **`platform_owner_grants`** with three OWNER_* roles. Tenant administration uses **`tenant_members.role`** `owner`/`admin`.

**PLATFORM_ADMIN_ROLE_READY = PARTIAL** — mechanism exists (owner grants + middleware), but it is not a unified “platform admin cabinet” and is isolated from `/admin`.

### 4.4 Tenant isolation

- Most `/api/v1/admin/*` routes scope data to `ctx.tenantId` — **respected**.
- **Exceptions / risks:**
  - `POST /api/v1/admin/flags` writes **global** `feature_flags` (service role) — any tenant admin with write can affect platform rollout.
  - `POST /api/v1/admin/jobs/cron-tick` and `schedule-reconcile` process **all tenants** when cron secret provided — callable from operator UI if secret pasted.
  - Billing pilot endpoints operate on platform billing tables with only `admin:write`, not `billing:admin` (owner-only policy exists but not applied on these routes).

### 4.5 Dangerous route protection

| Route class | Protection | Verdict |
|-------------|------------|---------|
| `/api/v1/owner/*` | Multi-layer: grant, session freshness, rate limit, optional IP/host/secret, step-up for critical | **Strong** |
| `/api/v1/admin/*` (typical) | Tenant + admin:read/write | **Adequate for tenant scope** |
| Cron job endpoints under `/api/v1/admin/jobs/*` | Cron secret optional via env | **Weak if `REQUIRE_CRON_SECRET` not enforced in prod** |
| Global feature flags | Tenant admin write | **Misaligned** — should be platform-owner only |
| `GET /api/v1/health` | Public | Acceptable |
| `GET /api/v1/ops/metrics` | Any tenant member | Acceptable for cockpit; not admin-only |

---

## 5. UI readiness (by surface)

### 5.1 Design system alignment

Tenant admin pages consistently use shared UI primitives (`Card`, `SectionHeader`, `Badge`, `Button`, `EmptyState`, `Skeleton`) and AISTROYKA typography tokens. Owner console uses mix of `card` utility class and design tokens — **slightly less polished** but functional.

### 5.2 Data loading & error handling

| Surface | Loading | Errors | Empty states |
|---------|---------|--------|--------------|
| Admin hub + control center | Skeleton + parallel fetch | Error message + retry pattern in clients | `EmptyState` where applicable |
| Operator workbench | Per-action loading flags | Card-level error with retry | Inline “no data” copy |
| AI observability | `QueryBoundary` + react-query | Query error boundaries | Dedicated empty titles |
| Governance/trust/system | Server-side; static empty components | Redirect or “unable to load” | Yes |
| Owner console | Single `loadAll()` | Single error string | Lists can be empty silently |

### 5.3 Mobile / responsive

Admin pages use responsive grids (`sm:`, `md:` breakpoints), overflow tables, flex-wrap action bars — **adequate for tablet/desktop**. Owner console is readable on mobile but dense ID displays are not operator-friendly.

### 5.4 Page-level summary

| Page | Status |
|------|--------|
| Admin hub | REAL_WORKING |
| Governance | REAL_WORKING (data-dependent) |
| Trust | REAL_WORKING (data-dependent) |
| System observability | REAL_WORKING / PARTIAL |
| Operator workbench | REAL_WORKING |
| AI suite (4 pages) | REAL_WORKING |
| Billing pilot | REAL_WORKING |
| Jobs / Push / Leads | REAL_WORKING |
| Owner console | REAL_WORKING / PARTIAL (UX) |
| **Testing / ROMA** | **MISSING** |
| **User management (platform)** | **MISSING** (only in `/owner` list view) |
| **Tenant CRUD (platform)** | **MISSING** (read-only list in owner) |
| **Break-glass grant UI** | **MISSING** |
| **Release approval workflow** | **MISSING** |

---

## 6. Missing admin modules

| Module | Expected for platform ops | Current state |
|--------|---------------------------|---------------|
| Unified platform admin nav | Single cabinet with sections | Split `/admin` vs `/owner`; poor nav coverage |
| Cross-tenant test orchestration | Run/monitor QA suites | CLI + CI only (`scripts/qa/`, `docs/qa/`) |
| Test history & artifacts | Screenshots, traces, logs | Playwright output local/CI; no admin viewer |
| Release readiness score | Aggregated gate verdict | `docs/qa/reports/RELEASE_VERDICT.md` file-based only |
| Device coverage dashboard | iOS/Android smoke status | Docs only (`docs/mobile/`, `docs/launch/`) |
| Feature flag admin (platform-scoped) | Owner-only global flags | Exposed to tenant admin in operator workbench |
| Account/tenant lifecycle admin | Create/suspend/archive tenants | Owner list read-only; no suspend UI |
| Audit log explorer (unified) | Search across audit types | Separate tenant audit + owner audit tails |
| AI observability (platform-wide) | Cross-tenant AI SLO | Tenant-scoped only under `/admin/ai` |
| ROMA intelligence dashboards | Risk/regression/coverage engines | Architecture docs only (`docs/roma/`); no runtime UI |

---

## 7. Testing / ROMA fit check

### 7.1 Required future capabilities vs today

| Capability | Status | Evidence |
|------------|--------|----------|
| Run test suite | **PARTIAL** | Operator “Run smoke suite” = tenant ops smoke (`POST /api/v1/admin/operator/smoke`), not Playwright/ROMA. Full QA via `bun run qa:platform` CLI. |
| View test history | **MISSING** | No DB table or API for test runs |
| View failed tests | **MISSING** | QA reports are markdown/JSON files under `docs/qa/reports/` |
| View backend/design/logic/AI/security reports | **MISSING** | Reports exist on disk; no admin UI renderer |
| Approve feature release after tests pass | **MISSING** | No approval workflow or gate API |
| Release readiness score | **PARTIAL** | `RELEASE_VERDICT.json` generated offline; not in admin |
| Device coverage | **MISSING** | No admin module; pilot docs only |
| Test artifacts (screenshot, trace, logs) | **MISSING** | Playwright artifacts not linked to admin |

### 7.2 What could host ROMA later

**Best fit surface:** extend **tenant admin** under `/admin/testing` or **platform owner** under `/owner/testing` depending on ROMA scope:

- **Tenant-scoped QA** (per-contractor pilot validation) → `/admin/testing` with existing `admin/layout.tsx` guard and sidebar extension.
- **Platform-wide release gate** (cross-tenant, production promotion) → `/owner/testing` with `requirePlatformOwnerApi` backends.

**Existing hooks to reuse:**

- `OperatorWorkbenchClient` “Operations & testing” card — pattern for run-and-display checks.
- `POST /api/v1/admin/operator/smoke` — response shape `{ overall, checks[], generated_at }` similar to ROMA check summaries.
- `AdminProductControlCenterClient` — parallel multi-API dashboard pattern.
- QA scaffold: `scripts/qa/`, `apps/web/tests/qa/`, `docs/qa/QA_PLATFORM.md` — execution layer exists; needs API + UI binding.

### 7.3 Readiness classification

| Dimension | Verdict |
|-----------|---------|
| **ADMIN_TESTING_SECTION_READY** | **NOT_READY** |
| **ROMA_CAN_BE_EMBEDDED_NOW** | **PARTIAL** — UI shell and operator patterns exist; no ROMA APIs, persistence, or artifact pipeline |

---

## 8. Risks

1. **Naming confusion:** Contractors see “Admin” and may assume platform-wide powers; global flags and billing reprocess are reachable from tenant admin operator workbench.
2. **Navigation debt:** Most admin value is hidden behind hub links; sidebar shows only push + jobs.
3. **Split cabinets:** Platform owner and tenant admin have no cross-links; operators may not discover `/owner`.
4. **Cron endpoints under `/api/v1/admin/jobs/*`:** Path suggests admin RBAC but actually uses cron secret; misfire if secret optional in environment.
5. **QA/ROMA divergence:** Substantial QA investment on branch is not integrated — risk of duplicate “testing truth” (CLI reports vs future ROMA UI).
6. **Owner console maturity:** Functional but minimal; no pagination, search, or tenant drill-down despite `GET /api/v1/owner/tenants/[tenantId]`.
7. **No runtime validation performed:** This audit is static code/doc inventory; live staging smoke of admin pages was not executed in this pass.

---

## 9. Recommended next steps

1. **Clarify product taxonomy** in UI copy: rename or subtitle tenant `/admin` as “Company admin” vs platform `/owner` as “Platform owner” to reduce RBAC confusion.
2. **Fix nav inventory:** Add sidebar entries (or admin sub-nav) for operator, AI, governance, system, billing-pilot, leads — match hub links.
3. **Harden dangerous APIs:** Move global `feature_flags` writes and cross-tenant cron triggers to `/api/v1/owner/*` or require `billing:admin`/platform grant.
4. **Define ROMA embedding target:** Choose platform-owner vs tenant-admin scope for Testing/ROMA; document in architecture before UI work.
5. **Add minimal Testing section (read-only first):** Surface `docs/qa/reports/RELEASE_VERDICT.md` and last CI run status via owner API — no new test runner yet.
6. **Design ROMA persistence layer:** Test run history, artifact storage (Supabase bucket or CI artifact URLs), release gate state machine — prerequisite for anything beyond PARTIAL.
7. **Live validation pass:** Run authenticated Playwright or manual smoke on staging for each `/admin/*` and `/owner` page with pilot admin credentials.

---

## 10. Final verdict

```
ADMIN_CABINET_EXISTS = PARTIAL
  (tenant /admin cabinet: YES; platform /owner cabinet: YES but minimal; no unified platform admin)

ADMIN_CABINET_WORKING = PARTIAL
  (core tenant admin pages and APIs are implemented; owner console works but thin; not live-validated in this audit)

PLATFORM_ADMIN_ROLE_READY = PARTIAL
  (platform_owner_grants + middleware exist; no platform_admin role; global actions still exposed to tenant admin)

ADMIN_TESTING_SECTION_READY = NOT_READY

ROMA_CAN_BE_EMBEDDED_NOW = PARTIAL
  (admin shell, operator run/display pattern, and offline QA scaffold exist; no ROMA API/UI integration)

NEXT_ACTION = Harden RBAC boundaries (global flags, cron routes), expand admin navigation, then add read-only
  Admin → Testing section fed by existing QA report artifacts before building full ROMA orchestration UI.
```

---

## Appendix A — Key source files

| Area | Path |
|------|------|
| Tenant admin layout guard | `apps/web/app/[locale]/(dashboard)/admin/layout.tsx` |
| Tenant admin API guard | `apps/web/lib/api/require-admin.ts` |
| RBAC policy | `apps/web/lib/tenant/tenant.policy.ts` |
| Dashboard admin nav | `apps/web/components/DashboardShell.tsx` |
| Owner layout guard | `apps/web/app/[locale]/(owner)/layout.tsx` |
| Owner API guard | `apps/web/lib/platform-owner/require-platform-owner-api.ts` |
| Owner middleware | `apps/web/lib/platform-owner/middleware-owner-gate.ts` |
| Operator workbench | `apps/web/app/[locale]/(dashboard)/admin/operator/OperatorWorkbenchClient.tsx` |
| Owner console | `apps/web/app/[locale]/(owner)/owner/owner-console-client.tsx` |
| QA platform (offline) | `docs/qa/QA_PLATFORM.md`, `scripts/qa/` |

## Appendix B — Admin API route inventory (36 files)

All under `apps/web/app/api/v1/admin/`:

`ai/usage`, `alerts`, `alerts/[id]/resolve`, `analytics/ai-guide`, `analytics/ai-risk`, `analytics/ops`, `analytics/productivity`, `anomalies`, `audit-logs`, `billing/pilot-status`, `billing/pilot-workspaces`, `billing/pilot-workspaces/[workspaceId]`, `billing/process-pending-events`, `billing/provider-status`, `billing/reprocess-event`, `billing/reprocess-workspace-events`, `billing/workspace-status`, `flags`, `jobs`, `jobs/cron-tick`, `jobs/schedule-reconcile`, `leads`, `leads/[id]`, `leads/bulk`, `metrics/overview`, `operator/context`, `operator/smoke`, `ops/ai-runtime`, `ops/diagnostics`, `privacy/findings`, `push/outbox`, `push/test`, `security/posture`, `slo/overview`, `slo/tenants/[tenantId]`, `tenants/[id]/flags`.
