# AISTROYKA Master Project Audit

Updated: 2026-05-01
Repository: `/Users/alex/Projects/AISTROYKA`

## Baseline Commands (Requested)

- `git status --short`: dirty files present before work:
  - `android/AiStroykaWorker/src/main/res/values/strings.xml` (pre-existing)
- `git branch --show-current`: `feat/platform-owner-cabinet`
- `git remote -v`: `origin git@github.com:2qjckdknjf-ctrl/Aistroyka-web.git`
- `git log -n 10 --oneline`: recent commits indicate active admin/platform-owner/mobile improvements.
- `git diff --stat` (initial): only pre-existing Android strings change.
- directory inventory (depth 3 equivalent): confirms monorepo with `apps/web`, `packages/*`, `ios/*`, `android/*`, extensive `docs/*`, plus local build artifact zones.

## Repository Structure

- Monorepo root with Bun workspace and pnpm workspace declaration.
- Primary product app: `apps/web` (Next.js App Router + API routes).
- Shared/contracts packages:
  - `packages/contracts`
  - `packages/api-client`
  - `packages/contracts-openapi`
- Mobile:
  - iOS: `ios/AiStroykaWorker`, `ios/AiStroykaManager`, `ios/Shared`
  - Android: `android/AiStroykaWorker`, `android/AiStroykaManager`, `android/shared`

## Package Manager and Tooling Reality

- Root `packageManager`: Bun (`bun@1.2.15` declared; local runtime used `bun 1.3.12`).
- Lockfile situation:
  - root `bun.lock`
  - additional `package-lock.json` in multiple packages (`apps/web`, `packages/contracts`, etc.)
  - causes Next.js workspace-root warnings during build.
- Workspace config mismatch:
  - root `package.json` workspaces include only `apps/web`, `packages/contracts`
  - `pnpm-workspace.yaml` includes additional `packages/api-client`, `packages/contracts-openapi`.

## Application and API Surface

- Total `route.ts` files under `apps/web/app/api`: 231
- `/api/v1/*` routes: 204 (canonical extensive surface)
- Non-v1/legacy/internal routes: 27 (compat and system endpoints remain)
- System routes found under both legacy and v1 namespaces:
  - `/api/system/*`
  - `/api/v1/system/*`
- Worker/sync/upload route cluster exists and is test-covered.

## Database / Supabase / Migrations

- Migration files detected: 99 under `apps/web/supabase/migrations` (after duplicate-copy cleanup).
- Naming order is monotonic (no malformed timestamps).
- Duplicate timestamps were detected earlier and resolved by removing duplicate-copy files with `(1)` suffix.
- Required core tables detected in migrations:
  - `tenants`, `tenant_members`, `projects`, `worker_reports`, `worker_tasks`, `media`,
    `upload_sessions`, `project_documents`, `project_cost_items`, `project_milestones`
- RLS enable statements found for these core tables.

## Frontend / Dashboard

- Dashboard shell and project detail available in localized App Router.
- Project detail includes functional tab architecture for:
  - intelligence, schedule, documents, costs, estimate, workers/reports/uploads.
- API-driven client panels (not static placeholders) are wired from detail page.

## Mobile Audit Snapshot

- iOS projects compile and resolve local `Shared` package.
- Android modules are real (manager + worker + shared API/auth/session layer), not shell-only stubs.

## CI / Deploy / Release

- CI workflow `ci-check.yml` enforces install + lint + test + `cf:build` on PR.
- Staging/prod Cloudflare deploy workflows exist and invoke pilot smoke.
- `wrangler.toml` + `wrangler.deploy.toml` present with env-specific worker names.
- Smoke scripts and env validation scripts exist and parse correctly.

## Security / Risk Highlights

1. Duplicate migration timestamp files introduce deterministic migration-order risk.
2. Mixed lockfiles/workspace declaration drift causes noisy and potentially brittle builds.
3. Large local artifact zones (`node_modules`, `.next`, mobile build output) exist in tree; mostly ignored, but increase operational complexity.
4. Operational verification still depends on external secrets/cloud access for fully live checks.

## Suspicious / Broken Areas Found During Audit

- Type error found in admin operator route (`ctx.membership.role`) and fixed to `ctx.role`.
- One observed build failure (`ENOENT .../.next/server/pages/500.js`) reproduced only when `build` and `cf:build` ran in parallel; sequential runs passed (execution race, not code defect).

## Audit Conclusion

- Core platform is structurally substantial and operationally active.
- Local code health baseline is strong after one route fix.
- Remaining risks are mostly operational governance and migration hygiene, not immediate compile/test failures.
