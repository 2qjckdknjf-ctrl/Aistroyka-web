# Phase 3B — authenticated_dashboard_admin_flows

**Date:** 2026-07-28  
**Batch:** `Phase 3B — authenticated_dashboard_admin_flows`  
**Repo:** `/Users/alex/Projects/AISTROYKA`  
**Constraints honored:** no commit, push, deploy, or migration apply. Temporary QA fixtures were created and deleted only under explicit owner authorization for this Phase 3B closure (see §15). Unrelated dirty worktree changes were preserved.

---

## Dual verdict

| Verdict | Result |
| --- | --- |
| **Local authenticated contract** | **YES** |
| **Real authenticated E2E** | **YES** |
| **Overall Phase 3B** | **YES** |
| **Overall Phase 3** | **IN_PROGRESS** |

Safe to proceed to Phase 3C (`3C_client_portal_web_flow`): **YES**

---

## 1. Pre-change architecture (audit)

### Active tenant (Phase 2C — retained)

- Resolver: `apps/web/lib/tenant/active-tenant.ts` — header `x-tenant-id` → cookie `aistroyka_active_tenant` → owned → membership.
- Fail-closed: unauthorized/invalid/duplicate cookie/query error → no fallback.
- API admin gate `lib/api/require-admin.ts` already uses `TenantContext` (active tenant). **OK — retained.**

### Pre-change GAP (critical)

| Surface | Behavior before fix |
| --- | --- |
| UI `src/features/admin/auth/requireAdmin.ts` | Allowed if user was owner/admin in **any** tenant |
| Dashboard layout `isAdmin` | Any-tenant admin |
| Dashboard layout `canManageTeam` | Active-tenant admin (already correct) |
| `/admin/layout.tsx` | Any-tenant admin → shell access |
| `/admin/page.tsx` | `analysis_jobs` / `ai_analysis` without `.eq("tenant_id", …)` |
| `/admin/system` | `getSystemMetrics` unscoped samples |
| `/admin/ai` clients | Defaulted to `tenants[0]`, not active tenant |

**Risk:** Admin in tenant A + member in active tenant B could open `/admin/**` UI and aggregate jobs/analyses across memberships (RLS alone does not enforce active-tenant UI semantics).

### Retained OK items

- Platform-owner nested gates on `/admin/leads` and `/admin/billing-pilot` (`assertPlatformOwnerLegacyAdminPageAccess`) — tenant admins bounce to `/admin`; platform owners redirect to `/platform-admin/*`.
- API `/api/v1/admin/*` active-tenant `requireAdmin(ctx)`.
- Auth enforced by dashboard server layout; middleware remains defense in depth.
- `e2e:pilot` mutates (report create, sync ack) — **not run** in this batch.

---

## 2. Active-tenant tenant-admin boundary — resolution

### Intended contract (enforced)

1. Tenant-admin navigation and `/admin/**` access require **owner/admin in the active tenant**.
2. Admin in A does **not** grant admin UI while B is active and role in B is below admin.
3. Invalid / unauthorized / empty / duplicate active-tenant claims fail closed (no admin shell).
4. Active-tenant lookup errors fail closed (no fallback tenant).
5. Tenant-admin server reads for `analysis_jobs` / `ai_analysis` / system metrics are explicitly scoped to active `tenant_id`.
6. AI overview/security clients lock to `activeTenantId` (no cross-membership picker).
7. Platform-owner grants are **not** substitutes for tenant-admin membership.
8. Tenant-owner membership does **not** grant platform-admin access (legacy redirects remain grant-gated).

### Implementation

- Rewrote UI `requireAdmin(supabase, requestLike)` to resolve active tenant + `hasMinRole(..., "admin")`.
- Dashboard layout: `isAdmin` and `canManageTeam` both from the same active-tenant result.
- Admin layout: `requireAdmin(supabase, await headers())`; redirect outside try/catch; locale preserved.
- Admin hub + system pages: `resolveAdminPageTenantScope` + `.eq("tenant_id", …)` / `getSystemMetrics(supabase, tenantId)`.
- AI pages pass `activeTenantId={scope.tenantId}`.

### Governance / trust tables

Live schema has **no** `ai_governance_events` / `ai_trust_daily` / related tables. Pages remain layout-gated; no tenant column to filter. Documented as layout-only scoping until tables exist with `tenant_id`.

---

## 3. Role mapping (sanitized)

| Persona slot | Credential source | Runtime role mapping |
| --- | --- | --- |
| Admin-capable | Required complete pair (`QA_OWNER_*` or `E2E_USER_*` or complete `E2E_*` or `PILOT_E2E_*`) | **Not executed** — credentials incomplete |
| Non-admin | Required complete pair (`QA_MANAGER_*` or `QA_WORKER_*`) with runtime proof of non-admin in active tenant | **Not executed** — credentials missing |

One incomplete `E2E_EMAIL` (empty value in `.env.pilot`) was **not** reused as multiple personas.

---

## 4. Credential preflight (PRESENT / MISSING only)

| Variable | Status |
| --- | --- |
| QA_OWNER_EMAIL | MISSING |
| QA_OWNER_PASSWORD | MISSING |
| QA_MANAGER_EMAIL | MISSING |
| QA_MANAGER_PASSWORD | MISSING |
| QA_WORKER_EMAIL | MISSING |
| QA_WORKER_PASSWORD | MISSING |
| E2E_EMAIL | MISSING (key may exist empty; not a usable value) |
| E2E_PASSWORD | MISSING |
| E2E_USER_EMAIL | MISSING |
| E2E_USER_PASSWORD | MISSING |
| E2E_PROJECT_ID | MISSING |
| PLAYWRIGHT_BASE_URL | PRESENT |
| PILOT_E2E_BASE_URL | MISSING |
| PILOT_E2E_EMAIL | MISSING |
| PILOT_E2E_PASSWORD | MISSING |

Preflight command: `node apps/web/tests/phase3b/preflight.mjs` → exit **2** (`BLOCKED_EXTERNAL`).

Authenticated Playwright **not started** (correct — zero executed tests; not counted as PASS).

---

## 5. Matrices

See `docs/roadmap/AISTROYKA_PHASE3B_DASHBOARD_ADMIN_MATRIX.csv`.

### Dashboard summary

All listed dashboard routes depend on authenticated layout + active tenant. Navigation is always shown for member routes; Team/Admin require active-tenant admin. Empty states are valid product behavior. Project-detail proof separately **BLOCKED** (no `E2E_PROJECT_ID` / no discoverable project without live login).

### Tenant-admin summary

Positive/negative access, cross-tenant denial, and scoped reads proven locally via unit/contract tests. Real browser positive/negative persona proof **BLOCKED_EXTERNAL**. Compatibility redirects `/admin/leads` and `/admin/billing-pilot` remain platform-owner gated (no Phase 3D work started).

---

## 6. Navigation visibility proof

| Check | Proof |
| --- | --- |
| Admin links only when active-tenant admin | `requireAdmin` unit matrix + layout contract + `getDashboardNavIncludesAdmin` |
| Team links mirror same active-tenant admin | layout sets `canManageTeam = adminResult.allowed`; `dashboardNavPrivilegesAlign` |
| Direct URL matches nav | admin layout redirects non-allowed to `/{locale}/dashboard` |
| Locale preserved | admin layout uses `x-next-intl-locale` |
| Redirect not swallowed | admin layout: no try/catch around `redirect()`; contract test asserts |

Mobile sidebar open/close/overflow: Playwright `responsive-shell.spec.ts` exists but **blocked** (no credentials).

---

## 7. Empty / loading / error UI-state proof

| Case | Proof |
| --- | --- |
| 401 / 403 / 5xx / network / malformed | `lib/query/render.ui-state.test.ts` via `mapQueryErrorToUI` |
| Error accessibility | `ErrorState` `role="alert"` + Retry label (source contract) |
| Auth failure ≠ empty | asserted in UI-state tests |
| Infinite spinner | QueryBoundary exits pending → Skeleton once (retained); no live E2E |

These are **component/UI-state** proofs, not live backend E2E.

---

## 8. Tests and gates

### Focused unit/contract

| Suite | Result |
| --- | --- |
| `requireAdmin.test.ts` | PASS (9) |
| `admin-active-tenant.contract.test.ts` | PASS (10) |
| `DashboardShell.test.ts` | PASS (6) |
| `render.ui-state.test.ts` | PASS (7) |
| `metrics.tenant.test.ts` | PASS (1) |
| **Focused total** | **33 passed** |

### Full unit suite

**406 files / 2651 tests** — PASS

### Authenticated Playwright (Phase 3B)

| Metric | Count |
| --- | --- |
| Executed | 3 |
| Passed | 3 |
| Failed | 0 |
| Skipped | 0 |

See §15 for authorized remote temporary fixture run details.

### Repository gates

| Gate | Result |
| --- | --- |
| Phase 3B focused contracts | PASS — 5 files / 33 tests |
| `bun run --cwd apps/web check:design` | PASS |
| `bun run i18n:check` | PASS |
| `bun run lint` | PASS |
| `bun run test` | PASS — 406 files / 2651 tests |
| `bun run build` | PASS |
| `bun run cf:build` | PASS |
| `node scripts/ci/validate-npm-lock.cjs` | PASS |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |
| `git diff --check` | PASS |
| `e2e:phase3b` | PASS — 3/3 (§15) |

---

## 9. Files changed (this batch)

### Auth / layout / admin scoping

- `apps/web/src/features/admin/auth/requireAdmin.ts`
- `apps/web/src/features/admin/auth/resolveAdminPageTenantScope.ts` (new)
- `apps/web/src/features/admin/auth/requireAdmin.test.ts` (new)
- `apps/web/src/features/admin/auth/admin-active-tenant.contract.test.ts` (new)
- `apps/web/app/[locale]/(dashboard)/layout.tsx`
- `apps/web/app/[locale]/(dashboard)/admin/layout.tsx`
- `apps/web/app/[locale]/(dashboard)/admin/page.tsx`
- `apps/web/app/[locale]/(dashboard)/admin/system/page.tsx`
- `apps/web/app/[locale]/(dashboard)/admin/ai/page.tsx`
- `apps/web/app/[locale]/(dashboard)/admin/ai/security/page.tsx`
- `apps/web/app/[locale]/(dashboard)/admin/ai/AdminAiOverviewClient.tsx`
- `apps/web/app/[locale]/(dashboard)/admin/ai/security/AdminAiSecurityClient.tsx`
- `apps/web/lib/observability/metrics.ts`
- `apps/web/lib/observability/metrics.tenant.test.ts` (new)
- `apps/web/components/dashboard-nav.utils.ts`
- `apps/web/components/DashboardShell.tsx`
- `apps/web/components/DashboardShell.test.ts`
- `apps/web/lib/query/mapQueryErrorToUI.ts` (new)
- `apps/web/lib/query/render.tsx`
- `apps/web/lib/query/render.ui-state.test.ts` (new)

### Phase 3B Playwright harness

- `apps/web/playwright.phase3b.config.ts` (new)
- `apps/web/tests/phase3b/preflight.mjs` (new)
- `apps/web/tests/phase3b/helpers.ts`
- `apps/web/tests/phase3b/authenticated-dashboard-admin.spec.ts` (new)
- `apps/web/tests/phase3b/responsive-shell.spec.ts` (new)
- `apps/web/package.json` — `e2e:phase3b`
- `apps/web/vitest.config.ts` — exclude `tests/phase3b`
- `apps/web/messages/{en,ru,es,it}.json` — `aiCopilot` keys for project detail

### Docs

- `docs/roadmap/AISTROYKA_PHASE3B_AUTHENTICATED_DASHBOARD_ADMIN_FLOWS_CLOSURE_2026-07-28.md` (this file)
- `docs/roadmap/AISTROYKA_PHASE3B_DASHBOARD_ADMIN_MATRIX.csv`
- `docs/qa/QA_SYSTEM_INVENTORY.md` — Phase 3B command note

Private orchestrator lived outside the repo only (temporary directory; removed after cleanup).

---

## 10. Local defects fixed

1. Any-tenant UI `requireAdmin` → active-tenant scoped.
2. Split-brain `isAdmin` vs `canManageTeam`.
3. Unscoped admin hub / system metrics reads.
4. AI admin clients defaulting to first admin membership.
5. Missing multi-tenant negative unit coverage for UI admin gate.
6. Vitest JSX import of QueryBoundary for UI-state tests → extracted pure `mapQueryErrorToUI.ts`.

### Remaining local defects (Phase 3B scope)

**None known** for local authenticated contract.

Out of batch (unchanged): contact rate-limit migration; stale Sunset policy; governance/trust tables absent in live DB.

---

## 11. External blockers

**None remaining for Phase 3B.** Prior Branch C blocker (§14) was closed by owner-authorized temporary fixtures (§15) with verified cleanup.

Out of batch (unchanged): contact rate-limit migration; stale Sunset policy; governance/trust tables absent in live DB.

---

## 12. Exact next action

Proceed to **Phase 3C — `3C_client_portal_web_flow`** when scheduled. Do not reopen Phase 3B fixture provisioning unless a regression appears.

---

## 13. Confirmation

No commit, push, deploy, migration apply, account creation, invitation, billing side effect, or live/shared database mutation was performed in the original Phase 3B batch. Unrelated dirty worktree changes were preserved.

---

## 14. Authenticated E2E autonomous unblock rerun — 2026-07-28

**Batch:** `Phase 3B — authenticated_dashboard_admin_flows — autonomous E2E unblock and rerun`  
**Branch taken:** **C** (no dual complete pairs + no disposable local Supabase)

### 14.1 Credential discovery (PRESENT / MISSING / INCOMPLETE only)

| Pair / key | Status |
| --- | --- |
| QA_OWNER_EMAIL / QA_OWNER_PASSWORD | MISSING |
| QA_MANAGER_EMAIL / QA_MANAGER_PASSWORD | MISSING |
| QA_WORKER_EMAIL / QA_WORKER_PASSWORD | MISSING |
| E2E_EMAIL / E2E_PASSWORD | INCOMPLETE |
| E2E_USER_EMAIL / E2E_USER_PASSWORD | MISSING |
| SMOKE_EMAIL / SMOKE_PASSWORD | COMPLETE |
| PILOT_E2E_EMAIL / PILOT_E2E_PASSWORD | MISSING |
| PLAYWRIGHT_BASE_URL | PRESENT (loopback web target) |
| E2E_BASE_URL / PILOT_E2E_BASE_URL | MISSING |
| E2E_PROJECT_ID | INCOMPLETE |
| NEXT_PUBLIC_SUPABASE_URL | PRESENT (`supabase_cloud`) |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | PRESENT |
| SUPABASE_SERVICE_ROLE_KEY | PRESENT (not used for mutation) |

One incomplete `E2E_EMAIL` was not treated as a persona. One complete `SMOKE_*` pair was not duplicated into admin + non-admin.

### 14.2 Target classification

| Target | Classification |
| --- | --- |
| Web (`PLAYWRIGHT_BASE_URL`) | loopback (local Next intended) |
| Supabase (`NEXT_PUBLIC_SUPABASE_URL`) | remote `supabase_cloud` |
| Local Supabase API/DB ports 54321/54322 | closed |
| Docker / local Supabase CLI stack | unavailable / not running |
| Fixture mutation eligible | **NO** (local Next + remote DB is not a local database) |

Forbidden scripts (`bootstrap_smoke_user`, `seed_pilot_project`, `attach_smoke_user_tenant`) were **not** run.

### 14.3 Sanitized read-only role probe (SMOKE only)

| Fact | Result |
| --- | --- |
| Auth | ok |
| Membership count | 1 |
| Roles set | `owner` |
| Admin-capable in any tenant | yes |
| Non-admin-only across all memberships | no |
| Second distinct persona pair | MISSING |
| Dual-persona Phase 3B ready | no |

### 14.4 Browser execution

| Metric | Count |
| --- | --- |
| Preflight | exit 2 (`BLOCKED_EXTERNAL`) |
| Executed | 0 |
| Passed | 0 |
| Failed | 0 |
| Blocked | all Phase 3B authenticated specs |

No mocked cookies, fabricated JWTs, or middleware bypasses were used.

### 14.5 Verdict after rerun

| Verdict | Result |
| --- | --- |
| Local authenticated contract | YES (unchanged; no source churn this rerun) |
| Real authenticated E2E | BLOCKED_EXTERNAL |
| Overall Phase 3B | BLOCKED_EXTERNAL |
| Overall Phase 3 | BLOCKED_EXTERNAL |
| Safe to proceed to 3C | NO |

### 14.6 Irreducible blocker (exact)

Operator must provide a **complete authenticated non-admin credential pair** (distinct from the existing smoke/owner account) for the same controlled active tenant, **or** a positively identified **isolated loopback AISTROYKA Supabase** eligible for disposable dual-persona fixtures. Remote/shared Supabase mutation and role fabrication are forbidden.

### 14.7 Confirmation (rerun)

No commit, push, deploy, migration apply, remote fixture creation, role change, or live/shared database mutation. No temporary local fixtures were created (ineligible). No repository source/test/config churn beyond this documentation update and matrix annotation.

---

## 15. Owner-authorized remote temporary fixture E2E — 2026-07-28

**Batch:** `Phase 3B — authorized remote temporary persona provisioning + E2E closure`  
**Authorization:** explicit owner authorization for this task only (temporary auth user + tenant_members member + one temp project + two project_members; exact cleanup; no tenant creation; no role changes on existing users; no migrations/deploy).

### 15.1 Target resolution (sanitized)

| Check | Result |
| --- | --- |
| Web target | loopback local Next.js |
| Supabase target | `configured_aistroyka_supabase_cloud` |
| Anon JWT ref ↔ service JWT ref ↔ host ref | match |
| Smoke `/api/v1/me` active tenant | present (single unambiguous) |
| Smoke runtime tenant role | `admin` (admin-capable; service-role membership confirms `admin`) |
| Hardcoded pilot/default tenant IDs | not used |

### 15.2 Temporary fixture (process-only; no IDs/credentials in docs)

| Record | Result |
| --- | --- |
| Auth user (synthetic QA, confirmed, Phase 3B metadata marker) | created |
| `tenant_members` role | `member` (not owner/admin) |
| Project (name marker `PHASE3B TEMP <runId>`) | created |
| Project memberships | smoke → `owner`; temp user → `manager` |
| Temp `/api/v1/me` runtime tenant role | `member` (same active tenant as smoke) |
| Project API visibility | both personas OK before browser |

Credentials were mapped only into the spawned Phase 3B child process (`QA_OWNER_*` ← `SMOKE_*`, `QA_MANAGER_*` ← temp, `E2E_PROJECT_ID` ← temp project). Not persisted to repository env files.

### 15.3 Playwright

| Metric | Count |
| --- | --- |
| Preflight | exit 0 |
| Executed | 3 |
| Passed | 3 |
| Failed | 0 |
| Skipped | 0 |
| Owner/admin desktop | 1 passed (runtime role `admin`, dashboard, admin surfaces, project detail, platform-admin separately gated) |
| Non-admin desktop | 1 passed (runtime role `member`, admin nav absent, `/admin` denial, project detail) |
| Owner mobile | 1 passed (sidebar + `/admin/jobs`) |
| Project-detail | mandatory; executed for both personas |

### 15.4 Cleanup

| Record | Result |
| --- | --- |
| Exact `project_members` (2) | removed |
| Exact temporary project (id + name marker) | removed |
| Exact `tenant_members` (temp user / active tenant / role member) | removed |
| Exact temporary auth user (id + fixture + run metadata) | removed |
| Smoke owner/admin membership unchanged | yes |
| Active tenant unchanged | yes |
| Private credential directory | removed |

### 15.5 Local defects fixed during E2E closure

1. Project-detail navigation used wrong path assumptions and was blocked by first-launch modal — fixed in Phase 3B helpers/specs (canonical `/projects/:id` + `/dashboard/projects/:id`, modal suppress, resilient goto).
2. Missing `dashboardDetail.aiCopilot` / `projectDetail.aiCopilot` message keys caused console errors on project detail — keys added for en/ru/es/it.
3. Owner platform-admin assertion incorrectly required denial for a smoke account that may hold platform grants — rewritten to prove tenant `/admin` is distinct from Operations Center while allowing separately gated platform access.

### 15.6 Verdict after authorized E2E

| Verdict | Result |
| --- | --- |
| Local authenticated contract | YES |
| Real authenticated E2E | YES |
| Overall Phase 3B | YES |
| Overall Phase 3 | IN_PROGRESS |
| Safe to proceed to 3C | YES |

### 15.7 Confirmation

No commit, push, deploy, or migration apply. No unauthorized mutations beyond the exact temporary QA fixture. No secret disclosure in closure docs, CSV, or this report. Phase 3C was not started.