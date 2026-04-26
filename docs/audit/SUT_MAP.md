# AISTROYKA E2E Audit - System Under Test Map

Date: 2026-04-26

## Repository And Tooling

- Repository root: `/Users/alex/Projects/AISTROYKA`
- Native package manager: Bun (`packageManager: bun@1.2.15`)
- Requested audit entrypoint: `pnpm -w audit:e2e`
- Workspaces declared in root `package.json`: `apps/web`, `packages/contracts`
- Turbo: not present (`turbo.json` not found)
- Existing Playwright config: `apps/web/playwright.config.ts`

## Applications And Packages

- Web/dashboard app: `apps/web` (Next.js App Router, locale segment under `app/[locale]`)
- API runtime: Next.js route handlers under `apps/web/app/api`; Cloudflare/OpenNext deployment config is present in `apps/web`
- Contracts package: `packages/contracts`
- Additional packages present but outside the root workspace declaration: `packages/api-client`, `packages/contracts-openapi`

## Auth For E2E

- Browser login page: `apps/web/app/[locale]/(auth)/login/page.tsx`
- Login endpoint: `POST /api/auth/login`
- Canonical v1 login alias: `POST /api/v1/auth/login`
- Login body: `{ "email": string, "password": string, "traceId"?: string }`
- Successful login sets Supabase `sb-*` cookies; browser E2E should prefer the real login flow.
- API E2E can use either Supabase session cookies or a user Bearer JWT. Service-role JWTs are not valid for user-scoped API context and must not be committed.
- Required env for audit credentials: `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`. Optional Supabase password-grant token minting can use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` if available.

## Canonical Sync Endpoints

All sync tests must use canonical `/api/v1/*` routes.

- `GET /api/v1/sync/bootstrap` in `apps/web/app/api/v1/sync/bootstrap/route.ts`
- `GET /api/v1/sync/changes?cursor=<n>&limit=<m>` in `apps/web/app/api/v1/sync/changes/route.ts`
- `POST /api/v1/sync/ack` in `apps/web/app/api/v1/sync/ack/route.ts`

Required headers:

- `x-device-id`: required for bootstrap, changes, and ack.
- `Authorization: Bearer <user access_token>` or valid Supabase session cookies.
- `x-client`: optional; lite clients (`ios_lite`, `android_lite`) trigger lite idempotency policy.
- `x-idempotency-key`: required for lite client mutating routes, including `POST /api/v1/sync/ack`.
- `x-request-id`: optional request correlation.

## Worker-Critical Routes

- `GET /api/v1/worker`
- `POST /api/v1/devices/register`
- `POST /api/v1/devices/unregister`
- `POST /api/v1/worker/day/start`
- `POST /api/v1/worker/day/end`
- `POST /api/v1/worker/report/create`
- `POST /api/v1/worker/report/add-media`
- `POST /api/v1/worker/report/submit`
- `GET|POST /api/v1/media/upload-sessions`
- `POST /api/v1/media/upload-sessions/[id]/finalize`
- `POST /api/v1/worker/sync`

Contract schemas:

- `packages/contracts/src/schemas/sync.schema.ts`
- `packages/contracts/src/schemas/worker.schema.ts`

## Dashboard Surfaces To Cover

All dashboard routes are locale-prefixed. Default audit locale is `ru` via `E2E_LOCALE`.

- `/{locale}/dashboard` - dashboard landing (`apps/web/app/[locale]/(dashboard)/dashboard/page.tsx`)
- `/{locale}/dashboard/projects` - dashboard projects list
- `/{locale}/dashboard/projects/[id]` - dashboard project detail
- `/{locale}/dashboard/tasks`
- `/{locale}/dashboard/workers`
- `/{locale}/dashboard/reports`
- `/{locale}/dashboard/daily-reports`
- `/{locale}/dashboard/approvals`
- `/{locale}/dashboard/uploads`
- `/{locale}/dashboard/devices`
- `/{locale}/dashboard/ai`
- `/{locale}/dashboard/alerts`
- `/{locale}/dashboard/workload`
- `/{locale}/dashboard/notifications`
- `/{locale}/portfolio`
- `/{locale}/billing`

Approvals/documents/budget surfaces:

- Approvals queue: `/{locale}/dashboard/approvals`
- Report approval details: `/{locale}/dashboard/reports/[id]`, `/{locale}/dashboard/daily-reports/[id]`
- Documents: project-scoped `ProjectDocumentsPanel` and `/api/v1/projects/[id]/documents`
- Budget-adjacent surfaces: portfolio, change orders, estimates, review pack, billing

## Existing Test Coverage

- `apps/web/tests/e2e/cockpit-smoke.spec.ts`
- `apps/web/tests/e2e/pilot-task-report-smoke.spec.ts`
- `apps/web/tests/e2e/ai-smoke.spec.ts`

Current gaps: no complete dashboard CTA inventory, no inventory-driven click audit, and no bootstrap/changes/ack sync E2E chain.
