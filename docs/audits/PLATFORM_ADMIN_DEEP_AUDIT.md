# Platform Admin Deep Audit

**Date:** 2026-07-03  
**Role:** Principal Platform Architect + Security Auditor + Refactoring Lead  
**Branch:** `feature/roma-qa-framework` @ `01706f46a416dc9d8a28bb83f7574fbe28084783`  
**Scope:** Read-only deep inventory with per-item disposition. No code changes.

**Prior art:** [`ADMIN_CABINET_STATE_AUDIT.md`](./ADMIN_CABINET_STATE_AUDIT.md)

---

## 0. Git safety

| Field | Value |
|-------|-------|
| pwd | `/Users/alex/Projects/AISTROYKA` |
| branch | `feature/roma-qa-framework` |
| SHA | `01706f46a416dc9d8a28bb83f7574fbe28084783` |
| status | Dirty (`AGENTS.md`, `package.json`, `apps/web/package.json` modified; untracked `docs/qa/`, `docs/launch/`, etc.) |

---

## 1. Current admin model (as-is)

Three **overlapping** authorization models exist today:

| Model | Mechanism | Used by |
|-------|-----------|---------|
| **Tenant RBAC** | `tenant_members.role` + `authorize(ctx, action)` | `/admin/*`, `/api/v1/admin/*`, dashboard nav |
| **Platform owner grant** | `platform_owner_grants.role` + `gateOwnerRequest` | `/owner`, `/api/v1/owner/*` |
| **Legacy email allowlist** | `ADMIN_EMAILS` env | `/admin/system` only (`lib/auth/admin.ts`) |

Additionally:

| Model | Mechanism | Used by |
|-------|-----------|---------|
| **Cron secret** | `x-cron-secret` + `REQUIRE_CRON_SECRET` | Cross-tenant job routes |
| **System key** | `X-System-Key` + `SYSTEM_API_KEY` | `/api/v1/system/*` |
| **Owner gate secret** | `X-Owner-Key` + `OWNER_GATE_SECRET` | `/api/v1/owner/*` (optional policy) |

**Break-glass:** `platform_break_glass_grants` table exists in migrations; `break-glass.service.ts` is **documented in architecture evidence but not present in this branch's codebase**. No UI or API routes wired.

---

## 2. Disposition legend

| Label | Meaning |
|-------|---------|
| **KEEP** | Correct placement; retain with minor hardening |
| **MOVE_TO_PLATFORM_ADMIN** | Belongs in isolated platform cabinet |
| **KEEP_IN_TENANT_ADMIN** | Belongs in company/tenant admin only |
| **LOCK_DOWN** | Keep location for now but tighten auth immediately |
| **REMOVE** | Should not exist (post-migration) |
| **DEPRECATE** | Keep temporarily with redirect/alias |
| **UNKNOWN_NEEDS_REVIEW** | Ambiguous ownership; human decision required |

---

## 3. UI routes inventory

### 3.1 Tenant admin — `/[locale]/(dashboard)/admin/*`

Guard: `admin/layout.tsx` → `requireAdmin()` (`tenant_members` owner/admin).  
Shell: `(dashboard)/layout.tsx` → `DashboardShell` (full product nav including public `Nav` link to `/admin`).

| Route | Files | Disposition | Rationale |
|-------|-------|-------------|-----------|
| `/admin` (hub) | `page.tsx`, `AdminProductControlCenterClient.tsx`, `AISystemHealth.tsx` | **KEEP_IN_TENANT_ADMIN** (hub only) | Tenant ops dashboard; strip platform-only widgets when split |
| `/admin/governance` | `governance/*` | **KEEP_IN_TENANT_ADMIN** | Tenant-scoped AI governance tables via user JWT/RLS |
| `/admin/trust` | `trust/*` | **KEEP_IN_TENANT_ADMIN** | Tenant-scoped trust indices |
| `/admin/system` | `system/page.tsx` | **UNKNOWN_NEEDS_REVIEW** | Uses `ADMIN_EMAILS` not tenant RBAC — third auth model |
| `/admin/operator` | `operator/*` | **SPLIT** | Tenant triage: KEEP; global ops: MOVE (see §3.4) |
| `/admin/ai` | `ai/*` | **KEEP_IN_TENANT_ADMIN** | Tenant AI observability |
| `/admin/ai/security` | `ai/security/*` | **KEEP_IN_TENANT_ADMIN** | Tenant security events |
| `/admin/ai/requests` | `ai/requests/*` | **KEEP_IN_TENANT_ADMIN** | Request ID explorer |
| `/admin/ai/guide` | `ai/guide/*` | **KEEP_IN_TENANT_ADMIN** | Guide analytics |
| `/admin/billing-pilot` | `billing-pilot/*` | **MOVE_TO_PLATFORM_ADMIN** | Platform billing cohort ops, not company billing |
| `/admin/jobs` | `jobs/*` | **KEEP_IN_TENANT_ADMIN** | Tenant failed-job queue (tenant-scoped API) |
| `/admin/push` | `push/*` | **KEEP_IN_TENANT_ADMIN** | Tenant push outbox |
| `/admin/leads` | `leads/*` | **MOVE_TO_PLATFORM_ADMIN** | Marketing/contact leads are platform ops, not tenant company admin |
| `/admin/leads/[id]` | `leads/[id]/*` | **MOVE_TO_PLATFORM_ADMIN** | Same |

### 3.2 Platform owner — `/[locale]/(owner)/owner`

Guard: `(owner)/layout.tsx` + middleware `gateOwnerRequest`.  
Shell: **isolated** (no `DashboardShell`, no locale product nav). `robots: noindex`.

| Route | Files | Disposition | Rationale |
|-------|-------|-------------|-----------|
| `/owner` | `owner/page.tsx`, `owner-console-client.tsx` | **MOVE_TO_PLATFORM_ADMIN** | Becomes root of platform cabinet |
| `(owner)/layout.tsx` | layout | **MOVE_TO_PLATFORM_ADMIN** | Becomes platform cabinet layout |

**Note:** `/owner` is **not** in `PROTECTED_PREFIXES` (middleware). Unauthenticated users get **403 Forbidden** from owner gate, not login redirect. Inconsistent with `/admin` UX.

### 3.3 Admin-adjacent (not `/admin`)

| Route | Disposition | Rationale |
|-------|-------------|-----------|
| `/[locale]/team` | **KEEP** (tenant dashboard) | Company team invites — correct surface |
| `/[locale]/billing` | **KEEP** (tenant dashboard) | Company billing (`billing:admin` = tenant owner) |
| `/[locale]/dashboard/projects/[id]/owner` | **KEEP** | Project stakeholder panel — unrelated to platform admin |

### 3.4 Operator workbench split (single file, multiple dispositions)

`OperatorWorkbenchClient.tsx` combines tenant and platform capabilities:

| Section / action | Disposition |
|------------------|-------------|
| Lead backlog triage | **MOVE_TO_PLATFORM_ADMIN** (if leads move) |
| Open alerts / anomalies / failed jobs (tenant) | **KEEP_IN_TENANT_ADMIN** |
| Run diagnostics snapshot | **KEEP_IN_TENANT_ADMIN** (tenant-scoped API) |
| Run smoke suite | **KEEP_IN_TENANT_ADMIN** (tenant ops smoke) |
| Enqueue reconcile / cron tick | **MOVE_TO_PLATFORM_ADMIN** + **LOCK_DOWN** |
| Send test push | **KEEP_IN_TENANT_ADMIN** |
| Global feature flag create/update | **MOVE_TO_PLATFORM_ADMIN** + **LOCK_DOWN** |
| Tenant flag override | **KEEP_IN_TENANT_ADMIN** (own tenant only) |
| Incident resolution (alerts/anomalies) | **KEEP_IN_TENANT_ADMIN** |

---

## 4. API routes inventory

### 4.1 `/api/v1/admin/*` (36 route files)

Default guard: `requireTenant` + `requireAdmin(ctx, read|write)`.

| API path | Disposition | Notes |
|----------|-------------|-------|
| `leads`, `leads/[id]`, `leads/bulk` | **MOVE_TO_PLATFORM_ADMIN** | Platform marketing ops |
| `billing/*` (8 routes) | **MOVE_TO_PLATFORM_ADMIN** | Global billing pilot/processor |
| `flags` GET/POST | **MOVE_TO_PLATFORM_ADMIN** + **LOCK_DOWN** | Global `feature_flags` table |
| `tenants/[id]/flags` | **KEEP_IN_TENANT_ADMIN** | Tenant override only |
| `jobs/cron-tick` | **MOVE_TO_PLATFORM_ADMIN** + **LOCK_DOWN** | All-tenant; cron secret only |
| `jobs/schedule-reconcile` | **MOVE_TO_PLATFORM_ADMIN** + **LOCK_DOWN** | All-tenant; cron secret only |
| `jobs` (list) | **KEEP_IN_TENANT_ADMIN** | Tenant-scoped queue |
| `operator/smoke` | **KEEP_IN_TENANT_ADMIN** | Tenant health aggregation |
| `operator/context` | **KEEP_IN_TENANT_ADMIN** | Tenant context |
| `ops/diagnostics` | **KEEP_IN_TENANT_ADMIN** | Tenant diagnostics |
| `ops/ai-runtime` | **KEEP_IN_TENANT_ADMIN** | Tenant AI runtime |
| `audit-logs` | **KEEP_IN_TENANT_ADMIN** | Tenant audit |
| `alerts`, `alerts/[id]/resolve` | **KEEP_IN_TENANT_ADMIN** | Tenant alerts |
| `anomalies` | **KEEP_IN_TENANT_ADMIN** | Tenant anomalies |
| `metrics/overview` | **KEEP_IN_TENANT_ADMIN** | Tenant metrics |
| `slo/overview`, `slo/tenants/[tenantId]` | **KEEP_IN_TENANT_ADMIN** | Tenant SLO |
| `ai/usage` | **KEEP_IN_TENANT_ADMIN** | Tenant AI usage |
| `analytics/*` | **KEEP_IN_TENANT_ADMIN** | Tenant analytics |
| `security/posture` | **KEEP_IN_TENANT_ADMIN** | Tenant security |
| `privacy/findings` | **KEEP_IN_TENANT_ADMIN** | Tenant privacy |
| `push/outbox`, `push/test` | **KEEP_IN_TENANT_ADMIN** | Tenant push |

### 4.2 `/api/v1/owner/*` (10 route files)

Guard: `requirePlatformOwnerApi` (tiered roles, audit insert, rate limit).

| API path | Disposition | Notes |
|----------|-------------|-------|
| `overview` | **MOVE_TO_PLATFORM_ADMIN** (rename namespace) | Core platform dashboard |
| `tenants`, `tenants/[tenantId]` | **MOVE_TO_PLATFORM_ADMIN** | Cross-tenant metadata |
| `users` | **MOVE_TO_PLATFORM_ADMIN** | Cross-tenant memberships |
| `audit` | **MOVE_TO_PLATFORM_ADMIN** | Platform owner audit |
| `diagnostics` | **MOVE_TO_PLATFORM_ADMIN** | Platform diagnostics |
| `health` | **MOVE_TO_PLATFORM_ADMIN** | Owner-tier health |
| `support/tickets`, `.../messages` | **MOVE_TO_PLATFORM_ADMIN** | Platform support |
| `critical/echo` | **MOVE_TO_PLATFORM_ADMIN** | Critical step-up test |

### 4.3 System / ops / health (non-admin namespace)

| API path | Auth today | Disposition |
|----------|------------|-------------|
| `GET /api/v1/health` | Public | **KEEP** (public readiness) |
| `GET /api/v1/ops/metrics` | Any tenant member | **KEEP_IN_TENANT_ADMIN** exposure; **LOCK_DOWN** optional admin-only |
| `GET /api/v1/system/health` | `X-System-Key` | **MOVE_TO_PLATFORM_ADMIN** (platform diagnostics backend) |
| `GET /api/v1/system/metrics` | `X-System-Key` | **MOVE_TO_PLATFORM_ADMIN** |
| `POST /api/v1/jobs/process` | Cron secret | **MOVE_TO_PLATFORM_ADMIN** + **LOCK_DOWN** |
| `GET /api/health`, `/api/system/*` (legacy) | varies | **DEPRECATE** → v1 successors |

### 4.4 Billing (tenant vs platform)

| API path | Guard | Disposition |
|----------|-------|-------------|
| `/api/v1/billing/checkout-*` | `billing:admin` (tenant owner) | **KEEP** (tenant dashboard) |
| `/api/v1/billing/sandbox/*` | `billing:admin` | **LOCK_DOWN** — internal simulation; consider platform-only |
| `/api/v1/admin/billing/*` | `admin:write` (tenant admin) | **MOVE_TO_PLATFORM_ADMIN** |

---

## 5. Guards, middleware, RBAC

| Component | Path | Disposition | Notes |
|-----------|------|-------------|-------|
| `middleware.ts` `PROTECTED_PREFIXES` | includes `/admin`, not `/owner` | **LOCK_DOWN** | Add platform host/path guards |
| `middleware.ts` `gateOwnerRequest` | `/owner`, `/api/v1/owner` | **MOVE_TO_PLATFORM_ADMIN** | Extend for `admin.aistroyka.ai` host |
| `admin/layout.tsx` `requireAdmin` | tenant owner/admin | **KEEP_IN_TENANT_ADMIN** | Rename UX to "Company admin" |
| `(owner)/layout.tsx` | platform grant | **MOVE_TO_PLATFORM_ADMIN** | |
| `lib/api/require-admin.ts` | API guard | **KEEP_IN_TENANT_ADMIN** | |
| `lib/tenant/tenant.policy.ts` | RBAC matrix | **KEEP** | Add `platform:*` actions in future |
| `lib/platform-owner/*` (20 files) | owner gate stack | **MOVE_TO_PLATFORM_ADMIN** | Rename package → `platform-admin` |
| `lib/auth/admin.ts` `ADMIN_EMAILS` | email allowlist | **DEPRECATE** | Replace with platform grant |
| `lib/api/cron-auth.ts` | cron secret | **MOVE_TO_PLATFORM_ADMIN** | Never callable from tenant UI |
| `lib/system/system-route-auth.ts` | system key | **MOVE_TO_PLATFORM_ADMIN** | Surface via platform UI proxy |

### 5.1 `platform_owner_grants`

| Item | Disposition |
|------|-------------|
| Table + RLS | **KEEP** |
| Roles `OWNER`, `OWNER_OPERATOR`, `OWNER_READONLY` | **KEEP** (rename display labels only) |
| Grant check in middleware + API | **MOVE_TO_PLATFORM_ADMIN** |

### 5.2 `tenant_members` checks

| Item | Disposition |
|------|-------------|
| `owner` / `admin` for `/admin` | **KEEP_IN_TENANT_ADMIN** |
| `billing:admin` (owner only) for checkout | **KEEP** |
| `admin:read` / `admin:write` for tenant APIs | **KEEP_IN_TENANT_ADMIN** |

---

## 6. Navigation & discoverability

| Component | Current behavior | Disposition |
|-----------|------------------|-------------|
| `Nav.tsx` | `/admin` in main product nav for all logged-in users | **LOCK_DOWN** — hide from non-tenant-admin; never link platform admin |
| `DashboardShell.tsx` | Admin section: push + jobs only | **KEEP_IN_TENANT_ADMIN** — expand tenant-only links |
| Admin hub inline links | governance, trust, operator, billing, etc. | **SPLIT** per §3 |
| `/owner` | No nav entry anywhere | **KEEP** (platform admin must stay unlinked from public site) |
| `HelpCenterClient.tsx` | Detects `/admin` and `/owner` paths | **KEEP** — update labels after split |

---

## 7. Shared libraries & features

| Path | Disposition | Notes |
|------|-------------|-------|
| `src/features/admin/auth/requireAdmin.ts` | **KEEP_IN_TENANT_ADMIN** | |
| `src/features/admin/ai/*` | **KEEP_IN_TENANT_ADMIN** | Tenant AI observability hooks |
| `src/features/admin/components/*` | **KEEP** (shared) | Reuse in platform admin UI |
| `lib/platform/flags/*` | **SPLIT** | Global ops → platform; tenant overrides → tenant |
| `lib/observability/*` | **KEEP** (shared services) | Called from both surfaces |
| `lib/ops/ops-metrics.repository.ts` | **KEEP** (shared) | Tenant-scoped reads |
| `lib/platform/billing-readiness/*` | **MOVE_TO_PLATFORM_ADMIN** | Platform billing ops |
| `lib/platform/jobs/*` | **SPLIT** | Tenant job queue vs global cron |

---

## 8. Missing / dead / duplicate items

| Item | Status | Disposition |
|------|--------|-------------|
| `break-glass.service.ts` | Documented, **not in tree** | **UNKNOWN_NEEDS_REVIEW** — restore under platform-admin |
| `/api/v1/admin/exports/*` | Not found | N/A |
| `lib/auth/admin.ts` vs `requireAdmin.ts` | Duplicate concepts | **DEPRECATE** email allowlist |
| `/api/health` vs `/api/v1/health` | Duplicate | **DEPRECATE** legacy |
| Platform admin nav / sub-routes | Missing | **MOVE_TO_PLATFORM_ADMIN** (new) |
| ROMA / Testing UI | Missing | See ROMA placement doc |
| Break-glass UI | Missing | **MOVE_TO_PLATFORM_ADMIN** (future) |

---

## 9. Summary counts

| Disposition | UI routes (approx) | API routes (approx) |
|-------------|-------------------|----------------------|
| KEEP / KEEP_IN_TENANT_ADMIN | 10 | 22 |
| MOVE_TO_PLATFORM_ADMIN | 5 + owner shell | 18 + all `/api/v1/owner/*` |
| LOCK_DOWN | 1 (operator sections) | 5 |
| DEPRECATE | 1 (`/admin/system` auth) | 2 legacy health |
| UNKNOWN_NEEDS_REVIEW | 1 (`/admin/system`) | break-glass service |
| REMOVE (post-migration) | 0 now | 0 now (aliases first) |

---

## 10. Key finding

The codebase **already contains** a platform-owner security stack (`lib/platform-owner/*`) and isolated UI route group `(owner)`, but:

1. It lives on the **same host** and obscure path `/owner` (not `admin.aistroyka.ai`).
2. **Dangerous platform functions** are incorrectly placed under tenant `/admin` and `/api/v1/admin`.
3. **Three auth models** (tenant RBAC, platform grant, `ADMIN_EMAILS`) create confusion and bypass risk.

Restructuring is **separation and relocation**, not greenfield build.
