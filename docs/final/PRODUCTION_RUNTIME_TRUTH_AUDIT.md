# Production Runtime Truth Audit

Phase: AUDIT ONLY  
Date/time: 2026-04-25 12:13 UTC+2 session  
Current branch: `hotfix/phase2-document-runtime-closure`  
Final audit verdict: NOT CLOSED

This audit is repository and local-script truth only. It does not prove live production readiness. No application code, migrations, secrets, or production database state were changed.

## 1. Current Branch

- Branch command: `git branch --show-current`
- Result: `hotfix/phase2-document-runtime-closure`
- Upstream shown by `git status --short --branch`: `origin/hotfix/phase2-document-runtime-closure`

## 2. Git Status

Command run:

```bash
git status --short --branch
git status --short | wc -l
```

Result at audit time:

```text
## hotfix/phase2-document-runtime-closure...origin/hotfix/phase2-document-runtime-closure
0 changed files reported by git status --short
```

Note: the session-provided initial snapshot showed many modified/untracked files. The live command during this audit reported a clean working tree. If the initial snapshot was from an earlier state, operator should treat that as reconciled by the current command output.

After writing this audit, `git status --short --branch` shows this new report as untracked:

```text
?? docs/final/PRODUCTION_RUNTIME_TRUTH_AUDIT.md
```

Files changed by this audit:

- `docs/final/PRODUCTION_RUNTIME_TRUTH_AUDIT.md`

## 3. Project Structure Summary

High-signal repository structure:

- `apps/web`: Next.js App Router web app and API runtime.
- `apps/web/app/api`: route handlers. Glob found 217 API route files.
- `apps/web/app/api/v1`: canonical product API surface. Git-tracked count command found 195 v1 route files.
- `apps/web/app/[locale]/(dashboard)`: localized dashboard, admin, billing, team, portfolio, stakeholder/client surfaces.
- `apps/web/supabase/migrations`: 96 SQL migrations.
- `packages/contracts`: shared contract schemas/types. Current `api/v1/types.ts` exports only a small subset of the route surface.
- `ios` and `android`: native manager/worker app foundations. Android scope was inspected only as repository presence, not expanded or validated.
- `.github/workflows`: root CI/deploy workflows.
- `scripts` and `apps/web/scripts`: release, smoke, migration, Cloudflare, and local ops scripts.

Package/deploy facts:

- Package manager: `bun@1.2.15`.
- Root build: `bun run build` -> contracts + web.
- Cloudflare build: `bun run cf:build`.
- Production deploy target in workflows: Cloudflare Worker `aistroyka-web-production`, host `https://aistroyka.ai`.
- Staging deploy target in workflows: Cloudflare Worker `aistroyka-web-staging`, host `https://staging.aistroyka.ai`.
- Vercel config exists at `apps/web/vercel.json`, but repo docs still conflict on whether Vercel is active/removed.

## 4. Files Inspected

Core scripts/config:

- `package.json`
- `apps/web/package.json`
- `.github/workflows/ci-check.yml`
- `.github/workflows/deploy-cloudflare-prod.yml`
- `.github/workflows/deploy-cloudflare-staging.yml`
- `apps/web/wrangler.toml`
- `apps/web/wrangler.deploy.toml`
- `apps/web/vercel.json`
- `scripts/smoke/pilot_launch.sh`
- `apps/web/scripts/smoke-prod.sh`
- `scripts/release/check-migrations.sh`
- `scripts/release-readiness-check.mjs`

Runtime/auth/API:

- `apps/web/middleware.ts`
- `apps/web/lib/supabase/server.ts`
- `apps/web/lib/tenant/tenant.context.ts`
- `apps/web/lib/tenant/tenant.policy.ts`
- `apps/web/lib/api/cron-auth.ts`
- `apps/web/lib/controllers/health.ts`
- `apps/web/app/api/health/route.ts`
- `apps/web/app/api/v1/health/route.ts`
- `apps/web/app/api/auth/login/route.ts`
- `apps/web/app/api/v1/auth/login/route.ts`
- `apps/web/app/api/v1/config/route.ts`
- `apps/web/app/api/v1/worker/route.ts`
- `apps/web/app/api/v1/worker/report/create/route.ts`
- `apps/web/app/api/v1/worker/report/add-media/route.ts`
- `apps/web/app/api/v1/worker/report/submit/route.ts`
- `apps/web/app/api/v1/media/upload-sessions/route.ts`
- `apps/web/app/api/v1/sync/bootstrap/route.ts`
- `apps/web/app/api/v1/worker/sync/route.ts`
- `apps/web/app/api/v1/tasks/route.ts`
- `apps/web/app/api/v1/tasks/[id]/route.ts`
- `apps/web/app/api/v1/reports/route.ts`
- `apps/web/app/api/v1/reports/[id]/route.ts`
- `apps/web/app/api/v1/approvals/pending/route.ts`
- `apps/web/app/api/v1/projects/[id]/media/route.ts`
- `apps/web/app/api/v1/projects/[id]/uploads/route.ts`
- `apps/web/app/api/v1/projects/[id]/documents/route.ts`
- `apps/web/app/api/v1/projects/[id]/documents/[documentId]/upload/route.ts`
- `apps/web/app/api/v1/projects/[id]/documents/[documentId]/decision/route.ts`
- `apps/web/app/api/v1/projects/[id]/documents/[documentId]/approval-history/route.ts`
- `apps/web/app/api/v1/projects/[id]/costs/route.ts`
- `apps/web/app/api/v1/projects/[id]/costs/[costItemId]/route.ts`
- `apps/web/app/api/v1/projects/[id]/client-view/route.ts`
- `apps/web/app/api/v1/projects/[id]/intelligence/route.ts`
- `apps/web/app/api/v1/admin/jobs/cron-tick/route.ts`
- `apps/web/app/api/v1/ops/metrics/route.ts`
- `apps/web/app/api/v1/ops/overview/route.ts`

Dashboard/product:

- `apps/web/components/DashboardShell.tsx`
- `apps/web/app/[locale]/(dashboard)/dashboard/page.tsx`
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/page.tsx`
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx`
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectDocumentsPanel.tsx`
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectCostsPanel.tsx`
- Dashboard route glob under `apps/web/app/[locale]/(dashboard)/dashboard`: 36 page files found.
- Project detail/client component glob under `dashboard/projects/[id]`: 50 TSX files found.

Database/docs:

- `apps/web/supabase/migrations/20260303000000_base_tenants_projects.sql`
- `apps/web/supabase/migrations/20260307400000_project_documents.sql`
- `apps/web/supabase/migrations/20260307500000_project_cost_items.sql`
- `apps/web/supabase/migrations/20260329100000_project_client_portal.sql`
- migration search over stakeholder, reports, media, documents, costs, events, RLS files.
- `packages/contracts/src/api/v1/types.ts`
- `docs/launch/Release1.md`
- `docs/execution/FINAL_SYSTEM_STATUS.md`

## 5. Commands Run

```bash
git status --short --branch
git branch --show-current
git status --short | wc -l
git ls-files "apps/web/app/api/v1/**/route.ts" | wc -l
git ls-files "apps/web/supabase/migrations/*.sql" | wc -l
bash scripts/release/check-migrations.sh
```

Command results:

- Branch: `hotfix/phase2-document-runtime-closure`
- Git status: clean at audit command time.
- Tracked v1 route count: 195.
- Tracked Supabase migration count: 96.
- Migration filename sanity: PASSED, 96 migrations.

Not run in this audit:

- `bun install --frozen-lockfile`
- `bun run lint`
- `bun run test`
- `bun run cf:build`
- `bun run smoke:prod`
- live `curl` checks against `https://aistroyka.ai`
- Supabase remote migration history checks
- authenticated browser smoke

## 6. Implemented Modules

### Public Health

Implemented:

- `GET /api/v1/health` is canonical and validates response via `HealthResponseSchema`.
- `GET /api/health` delegates to the same controller and emits legacy headers.
- Health includes Supabase reachability, AI flags, service role configured flag, app env, and optional build stamp from `NEXT_PUBLIC_BUILD_SHA` / `GITHUB_SHA`.

Runtime proof:

- Not live-proven in this audit.

### Auth, Session, Tenant, Role

Implemented:

- `POST /api/v1/auth/login` re-exports legacy `POST /api/auth/login`.
- Login uses Supabase password sign-in and sets cookies on success.
- `createClientFromRequest(request)` supports `Authorization: Bearer <user JWT>` and rejects service-role JWTs.
- Most v1 routes use `getTenantContextFromRequest(request)` and `requireTenant(ctx)`.
- Tenant policy supports owner/admin/member/viewer role order for internal workspace actions.

Runtime proof:

- Not live-proven.

### Dashboard

Implemented:

- Manager/ops dashboard shell exists.
- Project list and project detail exist.
- Project detail includes tabs for workers, contractors, reports, uploads, AI, intelligence, schedule, documents, costs, and estimate.
- Dashboard overview uses `/api/v1/ops/overview`.
- Ops metrics script uses `/api/v1/ops/metrics`.

Runtime proof:

- Not live-proven.

### Worker Workflow

Implemented:

- Task list/detail APIs exist.
- Worker-specific report APIs exist:
  - `POST /api/v1/worker/report/create`
  - `POST /api/v1/worker/report/add-media`
  - `POST /api/v1/worker/report/submit`
- Upload session API exists at `GET/POST /api/v1/media/upload-sessions`.
- Worker sync exists at `/api/v1/worker/sync`.

Runtime proof:

- Not live-proven.

### Reports, Media, Photo Evidence

Implemented:

- `GET /api/v1/reports` lists tenant-scoped reports with media count and analysis status.
- `GET /api/v1/reports/[id]` returns report detail with media.
- `PATCH /api/v1/reports/[id]` supports review statuses `approved`, `rejected`, `changes_requested`.
- Project media list route exists at `/api/v1/projects/[id]/media`.
- Upload session API exists and supports stuck-session filtering.

Runtime proof:

- Not live-proven.

### Manager Review / Approvals

Implemented:

- `GET /api/v1/approvals/pending` exists and requires report-review rights.
- Report review writes through domain repository and emits audit.
- Report approval history route exists.
- Document approval history route exists.

Runtime proof:

- Not live-proven.

### Documents

Implemented:

- `GET/POST /api/v1/projects/[id]/documents`.
- `POST /api/v1/projects/[id]/documents/[documentId]/upload`.
- `POST /api/v1/projects/[id]/documents/[documentId]/decision`.
- `GET /api/v1/projects/[id]/documents/[documentId]/approval-history`.
- UI exists in `ProjectDocumentsPanel`.
- Migration creates `project_documents` with draft/uploaded/under_review/approved/rejected/archived lifecycle and optional report/task/milestone links.

Runtime proof:

- Prior docs claim staging proof, but this audit did not reproduce it.

### Budget / Cost

Implemented:

- `GET/POST /api/v1/projects/[id]/costs`.
- `GET/PATCH /api/v1/projects/[id]/costs/[costItemId]`.
- UI exists in `ProjectCostsPanel`.
- Budget summary returns planned, actual, variance, over-budget signals, and related flags.
- Migration creates `project_cost_items`.

Runtime proof:

- Prior docs claim staging proof, but this audit did not reproduce it.

### Client / Stakeholder Portal

Implemented:

- Client project read model route exists at `/api/v1/projects/[id]/client-view`.
- Client/stakeholder UI surfaces exist under `dashboard/projects/[id]/client/**`.
- Client portal visibility flags exist in migrations:
  - `projects.client_portal_enabled`
  - `projects.client_show_budget_summary`
  - `project_milestones.client_visible`
  - `project_documents.client_visible`
- Stakeholder/project owner routes and client request/defect/service request/discussion surfaces exist.

Runtime proof:

- Not live-proven.

### AI / Intelligence

Implemented:

- `/api/v1/projects/[id]/intelligence` aggregates health, insights, risks, evidence coverage, reporting discipline, executive summary, recommendations, missing evidence, top risks, and project health score.
- The route logs telemetry and audit events.
- The response includes safe empty/default structures when component data is missing.
- Dashboard AI pages and project intelligence tab exist.

Runtime proof:

- Not live-proven. Prior docs note upstream provider quota failures for analysis in an older staging validation.

### Release / Deploy / Smoke

Implemented:

- Root PR CI: install, lint, tests, Cloudflare bundle.
- Production deploy workflow: push to `main` or manual dispatch, Cloudflare Worker deploy, blocking pilot smoke.
- Staging deploy workflow: push to `develop` or manual dispatch, Cloudflare Worker deploy, blocking pilot smoke.
- Smoke scripts exist:
  - `apps/web/scripts/smoke-prod.sh`
  - `scripts/smoke/pilot_launch.sh`
  - AI gate smoke script.
- Build stamp is wired in deploy workflows and exposed via health.

Runtime proof:

- Not live-proven in this audit.

## 7. Partially Implemented Modules

1. Contracts and OpenAPI coverage.
  - `packages/contracts/src/api/v1/types.ts` exports health, AI analyze, projects, and tenant only.
  - The actual v1 route tree is much larger. Contract coverage is partial.
2. Global uploads dashboard.
  - `/dashboard/uploads` is linked from navigation, KPI drilldowns, report media links, and e2e tests.
  - No `uploads/page.tsx` exists under `apps/web/app/[locale]/(dashboard)/dashboard`.
  - The API exists at `/api/v1/media/upload-sessions`, but manager UI route is missing.
3. Worker API naming.
  - `/api/v1/worker` is a 501 stub.
  - Actual worker workflow routes live under `/api/v1/worker/report/*`, `/api/v1/worker/sync`, `/api/v1/media/upload-sessions`, and task routes.
  - Any client expecting `/api/v1/worker` will fail.
4. Bearer-token parity.
  - Most routes use `createClientFromRequest(request)` for DB access.
  - Some important routes derive tenant from the request but then use cookie-only `createClient()`.
  - This is partial for mobile/API clients using `Authorization: Bearer`.
5. Tenant selection.
  - `getActiveTenantId` uses own tenant first, then first `tenant_members` row.
  - No request-level tenant selector was found in this path.
  - Multi-tenant users are not runtime-proven.
6. Billing/subscription truth.
  - Tenant context currently hardcodes `subscriptionTier: "free"`.
  - Billing tables/routes exist elsewhere, but entitlement truth is not part of tenant context.
7. Dashboard controls.
  - Date range and search in `DashboardShell` are local UI state and not connected to data/URL.
8. Report detail parity.
  - `/dashboard/reports/[id]` includes approval history.
  - `/dashboard/daily-reports/[id]` lacks the same approval history surface.

## 8. Broken Modules / Runtime Blockers Found In Repo

### P0 - Conditional: Global cron endpoint depends on production env

Evidence:

- `requireCronSecretIfEnabled` only enforces `x-cron-secret` when `REQUIRE_CRON_SECRET === "true"`.
- `/api/v1/admin/jobs/cron-tick` has no tenant context and processes all tenants using the admin client.

Impact:

- If production omits `REQUIRE_CRON_SECRET=true`, a global job-processing endpoint can be callable without the cron secret.

Status:

- Code allows secure operation if env is correct.
- Production env was not checked in this audit.

### P1 - Missing `/dashboard/uploads`

Evidence:

- `DashboardShell.tsx` links to `/dashboard/uploads`.
- `DashboardOpsOverviewClient.tsx`, priority actions, and report detail pages link to `/dashboard/uploads`.
- `apps/web/tests/e2e/cockpit-smoke.spec.ts` expects the uploads page.
- Glob found zero files under `app/[locale]/(dashboard)/dashboard/uploads`.

Impact:

- Authenticated dashboard navigation and cockpit smoke are broken for uploads.

### P1 - Worker/mobile Bearer routes likely break because they switch back to cookie-only Supabase

Evidence:

- `apps/web/app/api/v1/sync/bootstrap/route.ts` calls `getTenantContextFromRequest(request)` and then `createClient()`, not `createClientFromRequest(request)`.
- `apps/web/app/api/v1/projects/[id]/uploads/route.ts` does the same.
- `apps/web/app/api/v1/config/route.ts` also uses cookie-only `createClient()`.

Impact:

- Bearer-auth mobile/CLI clients can resolve tenant context but then perform DB reads with a cookie client that may have no session.
- Worker bootstrap and project uploads are critical to mobile/report runtime truth.

### P1 - Stakeholder role mismatch can block portal-only users

Evidence:

- Migration `20260329130000_tenant_members_stakeholder_role.sql` adds `stakeholder` to tenant member roles.
- `tenant.context.ts` only accepts roles `owner`, `admin`, `member`, `viewer`.
- `tenant.policy.ts` references `ctx.role === "stakeholder"` in `isPortalOnlyStakeholderRole`, but `getRoleInTenant` will return null for `stakeholder`.
- `/api/v1/projects/[id]/client-view` calls `requireTenant(ctx)`.

Impact:

- A portal-only user represented as tenant member `stakeholder` may fail tenant resolution before client-view authorization.
- Stakeholder portal cannot be called production-ready until this is tested or fixed.

### P1 - `/api/v1/worker` is a 501 stub

Evidence:

- `apps/web/app/api/v1/worker/route.ts` returns `501 worker_stub` for GET and POST.

Impact:

- Not a blocker if no client calls this route.
- Runtime blocker if mobile/client discovery expects `/api/v1/worker`.

### P1 - No live production proof in this audit

Evidence:

- No live health, login, authenticated dashboard, worker report, upload, approval, document, cost, stakeholder, AI, or release smoke command was run.

Impact:

- Production runtime truth is not closed.

## 9. Modules Implemented In Repo But Not Live-Proven

All critical product flows are unproven in this audit:

- `/api/v1/health` on production with build stamp.
- Login, session cookie write, cookie refresh, and authenticated dashboard load.
- Tenant membership and role enforcement.
- Cross-tenant denial and role denial.
- Manager dashboard, project list, project detail.
- Worker auth path, task access, report create, media upload, report submit.
- Manager report visibility, approve, reject, request changes, audit/history.
- Document create, upload, review lifecycle, file access, approval history.
- Cost create/list/update and budget summary correctness.
- Stakeholder/project owner portal, read-only project view, milestone/document/budget visibility settings.
- AI intelligence outputs and safe degradation with sparse data.
- Production deploy target/ref, Cloudflare route, smoke gate, and authenticated endpoint.
- Remote Supabase migration history and RLS behavior.

Prior docs claim some staging/live success, but those claims were not revalidated here.

## 10. Critical Runtime Risks

1. P0 conditional: global cron/job processing is safe only if production sets `REQUIRE_CRON_SECRET=true` and `CRON_SECRET`.
2. P1: `/dashboard/uploads` missing despite being a first-class nav and smoke target.
3. P1: worker/mobile bootstrap and uploads routes are not consistently using request-bound Supabase clients.
4. P1: stakeholder role exists in migrations but is rejected by tenant context role parsing.
5. P1: `/api/v1/worker` is a stub; client route expectations must be confirmed.
6. P1: no live production evidence collected for authenticated critical routes.
7. P2: contract surface does not cover most v1 routes.
8. P2: PR CI does not run migration history checks, DB RLS tests, Playwright e2e, or authenticated smoke.
9. P2: `apps/web/scripts/smoke-prod.sh` accepts health HTTP 503 as smoke pass if response contains `ok`; this is useful for degraded diagnostics but too weak for production readiness.
10. P2: docs drift around Vercel, nested workflows, and removed files can mislead operators.
11. P2: active tenant resolution is implicit and first-row based for member users.
12. P2: `subscriptionTier` in tenant context is hardcoded to `free`.

## 11. Required Validation Commands

Repository validation:

```bash
bun install --frozen-lockfile
bun run lint
bun run test
bun run cf:build
bash scripts/release/check-migrations.sh
bun run release:check
```

Smoke and production/staging validation:

```bash
bun run smoke:prod
BASE_URL=https://aistroyka.ai bash scripts/smoke/pilot_launch.sh
BASE_URL=https://staging.aistroyka.ai bash scripts/smoke/pilot_launch.sh
```

Production truth commands, with operator-provided non-secret auth material only:

```bash
curl -sS https://aistroyka.ai/api/v1/health
AUTH_HEADER="Bearer <user_access_token>" BASE_URL=https://aistroyka.ai bash scripts/smoke/pilot_launch.sh
```

Supabase validation needed before closure:

- Compare remote applied migration history against `apps/web/supabase/migrations`.
- Confirm RLS enabled on exposed public tables.
- Test same-tenant allow, cross-tenant deny, role deny, stakeholder allow.
- Test storage bucket policies for `media` uploads and reads.
- Do not apply production migrations without explicit operator approval.

E2E validation needed:

```bash
cd apps/web
bun run e2e -- tests/e2e/cockpit-smoke.spec.ts
bun run e2e -- tests/e2e/pilot-task-report-smoke.spec.ts
```

These e2e tests are not sufficient alone because current specs can early-return on unauthenticated redirects.

## 12. Proposed Closure Order

1. Close global release truth prerequisites.
  - Verify production branch/ref, Cloudflare target, required runtime env, cron secret requirement, build stamp, and `/api/v1/health`.
2. Fix the smallest repo-visible dashboard blocker.
  - Add or wire the missing `/dashboard/uploads` route using existing upload session API and existing UI patterns.
  - Re-run cockpit smoke with authenticated state.
3. Fix request-bound Supabase client consistency on worker/mobile critical routes.
  - Start with `sync/bootstrap` and `projects/[id]/uploads`.
  - Validate Bearer token auth, cookie auth, tenant isolation, and mobile-lite headers.
4. Resolve stakeholder role runtime mismatch.
  - Either accept `stakeholder` in tenant context with portal-only authorization, or prove stakeholder users use another role path.
  - Validate client-view portal access and internal workspace denial.
5. Prove worker report flow.
  - Login/auth, task access, upload session, media upload, report create/add-media/submit, manager report visibility.
6. Prove manager review.
  - Approve, reject, request changes, and audit/history for reports.
7. Prove documents.
  - Create/register, upload, submit/review/decision, link to project/task/report/milestone, approval history, manager surface.
8. Prove cost layer.
  - Create/list/update cost item, budget summary, over-budget/cost pressure signals, manager surface.
9. Prove stakeholder/client portal.
  - Owner/stakeholder access, read-only project view, milestones, documents, budget visibility settings, pending decisions where implemented.
10. Prove AI/intelligence honesty.
  - Project health score, missing evidence, top risks, executive summary, safe missing-data degradation, no fake AI claims.
11. Close release report.
  - Build, tests, migration sanity, smoke, production health, authenticated endpoint, final `PRODUCTION_RUNTIME_TRUTH_REPORT.md`.

## 13. Recommended First Implementation Target

First target after this audit: fix `/dashboard/uploads`.

Reason:

- It is a concrete repo-visible P1.
- It blocks a first-class dashboard navigation item.
- It blocks the existing cockpit smoke path.
- The backend API already exists at `/api/v1/media/upload-sessions`, so this should be a minimal UI wiring task rather than a new product feature.

Second target immediately after: replace cookie-only `createClient()` with request-bound `createClientFromRequest(request)` in worker/mobile-critical v1 routes where tenant context already came from the request.

## 14. Audit Verdict

Final verdict: NOT CLOSED

Reason:

- Core modules are broadly implemented in the repository, but production runtime truth is not proven.
- At least four meaningful P1 blockers/gaps remain before claiming pilot readiness from this sprint:
  - missing `/dashboard/uploads`;
  - request/client auth inconsistency in worker/mobile runtime paths;
  - stakeholder role mismatch risk;
  - no live authenticated production evidence from this audit.

