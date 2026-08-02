# Phase 3C — client_portal_web_flow

**Date:** 2026-07-28  
**Batch:** `Phase 3C — client_portal_web_flow` (local contract + authorized real stakeholder E2E)  
**Repo:** `/Users/alex/Projects/AISTROYKA`  
**Constraints honored:** no commit, push, deploy, migration apply; no unauthorized tenant/role/business mutations; temporary fixture created only under owner authorization and fully cleaned up

---

## Dual verdict

| Verdict | Result |
| --- | --- |
| **Local client-portal contract** | **YES** |
| **Real stakeholder E2E** | **YES** |
| **Overall Phase 3C** | **YES** |
| **Overall Phase 3** | **IN_PROGRESS** |

Safe to proceed to Phase 3D: **YES**

### Previous external blocker (closed)

Earlier same-day state was `BLOCKED_EXTERNAL` because no durable stakeholder credential pair existed and fixture creation was not authorized. Owner later authorized one temporary AISTROYKA Supabase Cloud Phase 3C fixture (auth user + stakeholder membership + portal project + project_stakeholders + project_handover) with mandatory exact cleanup. That path was executed, Playwright passed, cleanup proven, smoke membership unchanged.

---

## 1. Pre-change topology (audit)

### Shell

- Authenticated routes share `app/[locale]/(dashboard)/layout.tsx` → `DashboardShell`.
- Pre-3C: shell always rendered full internal nav (projects, workers, AI, admin when `isAdmin`); **no** `portalOnly` from active-tenant role.
- `isPortalOnlyStakeholderRole` existed in `tenant.policy.ts` but was unused by the layout.

### Middleware (Phase 2B6 — retained)

- `resolveStakeholderPageRedirect` + `redirectIfStakeholderBlockedPath`.
- Allowed: `/portal/projects/**`, `/dashboard/projects`, `/dashboard/projects/:id/client/**`, stakeholder-invite.
- Pre-3C blocked-path redirects landed on `/dashboard/projects` (not portal home).

### Known link risks (pre-3C)

| Link | Issue |
| --- | --- |
| Portal list → `/dashboard/projects/:id/client` | Allow-listed — OK (compatibility) |
| Client view → back `/dashboard/projects/:id` | Stakeholder middleware redirects back to `/client` (**loop**) |
| Handover pack → `/dashboard/projects/:id/handover/pack` | **Not** allow-listed — dead end / redirect away |
| Workload `action_url` | Dynamic; manager-shaped URLs unsafe if ever mixed |

---

## 2. Portal-only shell contract (enforced)

1. Server layout resolves **active-tenant role** via `getActiveTenantRoleForUser(supabase, userId, headers)`.
2. `portalOnly = role === "stakeholder"` (`isPortalOnlyShellFromRole`) — **not** from pathname.
3. When `portalOnly`:
   - nav = `/portal/projects` only;
   - logo home = `/portal/projects`;
   - no admin/team/internal ops links;
   - no date-range / search chrome;
   - no first-launch / AI-guide overlays;
   - `data-portal-shell="1"`.
4. Owner/admin/member shell unchanged.
5. Middleware blocked paths and `/dashboard` root now redirect to **`/portal/projects`**.

---

## 3. Canonical UI/API decision

| Surface | Canonical contract |
| --- | --- |
| Portal project list UI | `GET /api/v1/portal/projects` |
| Portal project detail UI (client view) | `GET /api/v1/projects/:id/client-view` → `ClientProjectView` |
| Portal detail alias | `GET /api/v1/portal/projects/:id` (same customer-safe projection; retained for API clients) |

**Rationale:** existing client UI already consumes `client-view`; both paths are finance-guarded customer projections. UI must not receive manager DTOs.

---

## 4. Link reachability results

| Change | Result |
| --- | --- |
| Stakeholder back link | `/portal/projects` (audience-aware) |
| Internal preview back link | `/dashboard/projects/:id` retained |
| Handover pack link | shown only for `audience=internal` |
| Workload action URLs | sanitized via `resolvePortalSafeActionUrl` / fallback `/portal/projects` |
| Portal list open link | remains `/dashboard/projects/:id/client` (allow-listed) |
| Handover pack documents section href | customer-safe `/client` base (no manager `?tab=documents`) |
| Post-auth default for stakeholder | `/portal/projects` when active role known (login + middleware auth-page redirect) |
| Login without invented `next=/dashboard` | email login no longer forces `explicit_next` to dashboard (G-11) |
| Legacy `next=/dashboard` for stakeholder | overridden to portal home in `resolvePostAuthEntry` |

---

## 5. Customer-finance proof

- Existing Phase 2B2 route finance tests retained (portal + client-view + change-orders + estimates + decisions + notifications/activity).
- Real Playwright recursive JSON-key scan on portal list, client-view, and portal detail responses.
- Authenticated stakeholder `GET /api/v1/projects/:id/costs` → exact **403**.
- QA `03-roles` portal finance test: no post-401 soft-skip when client creds provided; recursive key walk.

---

## 6. Loading / empty / error

`PortalProjectsListClient` distinguishes:

- loading (status);
- empty (valid zero projects);
- auth 401/403 (not empty);
- generic error + labeled Retry;
- ready list.

---

## 7. Portal actions

- Response controls remain capability-gated via `ClientProjectView.capabilities` (existing).
- No live mutations in real Phase 3C E2E (visibility/capability only).
- Route-level auth retained on respond endpoints.
- `ClientPortalDailyDigestSection` remains optional / not mounted — not a blocker.

---

## 8. Target resolution + authorized fixture (sanitized)

| Check | Result |
| --- | --- |
| Smoke pair (`SMOKE_*`) | PRESENT — real login OK |
| Smoke `/api/v1/me` role | `admin` (admin-capable) |
| Smoke active tenant | PRESENT, unique (1 membership) |
| Web target | loopback Next.js |
| Supabase refs (anon / service / host) | MATCH — AISTROYKA cloud |
| Root service-role | PRESENT (JWT-like); preferred over web placeholder |
| Pre-run smoke membership snapshot | SAVED |
| Post-cleanup smoke membership | UNCHANGED |
| Post-cleanup smoke active tenant | UNCHANGED |

### Temporary fixture types created (then deleted)

1. Auth user (`app_metadata.aistroyka_fixture=phase3c_stakeholder_e2e` + `run_id`)
2. `tenant_members` role=`stakeholder` (smoke active tenant only)
3. Project `PHASE3C TEMP <runId>` with `client_portal_enabled=true`, `client_show_budget_summary=false` (no `project_members` for temp user)
4. `project_stakeholders` active `client_viewer`
5. `project_handover` `in_progress` (prevent GET client-view write via `ensureHandoverRow`)

Temporary credentials passed only to child Playwright env (`QA_CLIENT_*`, `E2E_PROJECT_ID`, `PLAYWRIGHT_BASE_URL`, `PHASE3C_FIXTURE_TENANT_ID`). Not written to repository `.env*`.

### Cleanup proof

| Record | Result |
| --- | --- |
| project_handover | OK |
| project_stakeholders | OK |
| projects (exact id + tenant + name) | OK |
| tenant_members (stakeholder) | OK |
| auth user (id + fixture metadata) | OK |
| run-marker residual scan | OK |
| private temp creds | OK |
| smoke unchanged | OK |

---

## 9. Real stakeholder E2E proof

Command: `bun run --cwd apps/web e2e:phase3c` (via private orchestrator)

| Metric | Count |
| --- | --- |
| Projects | chromium-desktop + chromium-mobile |
| Executed | 2 |
| Passed | 2 |
| Failed | 0 |
| Skipped | 0 |

Proven matrix (both projects):

- Login without `next` → localized `/portal/projects` (G-11)
- Re-open login while authenticated → `/portal/projects`
- `/api/v1/me` → 200, `role=stakeholder`, tenant matches fixture
- Portal-only shell (`data-portal-shell="1"`); no dashboard/admin/team/AI nav
- Portal list contains exact `E2E_PROJECT_ID` only
- Client view + `client-view` + `portal/projects/:id` → 200, finance-clean
- `/dashboard/projects/:id` → `/client` without loop; back → portal home
- Internal `/dashboard`, `/admin`, `/billing`, `/portfolio`, `/projects` → portal home
- Costs → exact 403; no unexpected 5xx / console / page errors; no horizontal overflow

---

## 10. Defects found by real E2E (fixed in this batch)

| Defect | Fix |
| --- | --- |
| Login invented `next=/dashboard`, blocking stakeholder default portal | Login uses absent `next` as undefined; AuthProviderButtons keeps fallback for OAuth only |
| Stakeholder + legacy `next=/dashboard` still `explicit_next` | `resolvePostAuthEntry` overrides contractor dashboard home for stakeholder |
| `projectRepo.getById` omitted `client_portal_enabled` → client-view always 403 | Select includes portal flags; regression tests added |
| Playwright `fill` on controlled inputs submitted empty body | Phase 3A-style `pressSequentially` + login API assert |
| Preflight allowed project-detail without `E2E_PROJECT_ID` | Preflight requires `E2E_PROJECT_ID` |

---

## 11. Tests and gates

### Focused (Phase 3C slice)

| Suite | Result |
| --- | --- |
| `entry-routing.test.ts` | PASS |
| `stakeholder-middleware-gate.test.ts` | PASS |
| `DashboardShell.test.ts` | PASS |
| `portal-action-url.test.ts` | PASS |
| `handover-pack.service.test.ts` | PASS |
| `stakeholders.policy.test.ts` | PASS |
| `project.repository.test.ts` | PASS |
| `cabinet-dashboard-routing.policy.test.ts` | PASS |
| **Focused total** | **8 files / 52 tests** |

### Full unit suite

**408 files / 2663 tests** — PASS

### Stakeholder Playwright (Phase 3C)

| Metric | Count |
| --- | --- |
| Executed | 2 |
| Passed | 2 |
| Failed | 0 |
| Skipped | 0 |

### Repository gates

| Gate | Result |
| --- | --- |
| `bun run --cwd apps/web check:design` | PASS |
| `bun run i18n:check` | PASS |
| `bun run lint` | PASS |
| `bun run test` | PASS — 408 / 2663 |
| `bun run build` | PASS |
| `bun run cf:build` | PASS |
| `node scripts/ci/validate-npm-lock.cjs` | PASS |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |
| `git diff --check` | PASS |
| `e2e:phase3c` (orchestrated) | PASS — 2/2 + cleanup OK |

---

## 12. Files changed (this batch)

### Local portal contract (prior same-day; retained)

- Layout / shell / middleware stakeholder paths, portal-action-url, client back links, handover pack client href, entry-routing portal default, messages, QA soft-skip removal, Phase 3C harness.

### Real E2E closure additions

- `apps/web/app/[locale]/(auth)/login/page.tsx` — no invented default `next`
- `apps/web/lib/entry/entry-routing.ts` + `.test.ts` — stakeholder dashboard-home override (G-11)
- `apps/web/lib/domain/projects/project.repository.ts` + `.test.ts` — portal flags on `getById`
- `apps/web/lib/domain/stakeholders/stakeholders.policy.test.ts` — regression for missing portal flag
- `apps/web/cabinet-dashboard-routing.policy.test.ts` — middleware `activeRole` assert
- `apps/web/tests/phase3c/preflight.mjs` — require `E2E_PROJECT_ID`
- `apps/web/tests/phase3c/client-portal.spec.ts` — full matrix desktop+mobile
- `apps/web/playwright.phase3c.config.ts` — mobile project + longer timeout

### Docs

- `docs/roadmap/AISTROYKA_PHASE3C_CLIENT_PORTAL_WEB_FLOW_CLOSURE_2026-07-28.md` (this file)
- `docs/roadmap/AISTROYKA_PHASE3C_CLIENT_PORTAL_MATRIX.csv`

---

## 13. Remaining Phase 3C defects / blockers

**None known** inside Phase 3C scope.

Optional (non-blocker): mount `ClientPortalDailyDigestSection`.

Out of batch: contact rate-limit migration; Sunset policy; Phase 3D platform-admin.

---

## 14. Confirmation

No commit, push, deploy, or migration apply. No tenant creation. No changes to smoke user roles/memberships. No invitation/email. No business documents/costs/requests beyond authorized fixture rows. Temporary fixture fully removed. Unrelated dirty worktree preserved. No secrets, JWTs, user/project/tenant IDs, or credentials disclosed in reports.
