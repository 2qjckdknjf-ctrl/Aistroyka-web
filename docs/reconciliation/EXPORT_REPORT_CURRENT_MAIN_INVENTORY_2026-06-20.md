# Export / Report Current Main Inventory — 2026-06-20

Base: `origin/main` at `ff537c8dec1d9dcdd7ef834894951e625aa97a87`.

## Export Routes In Main

| Route/path | File | Method | Current behavior | Data returned | Auth/tenant check | Role check | Side effects | Tests | Consumers |
|---|---|---|---|---|---|---|---|---|---|
| No project CSV export route | n/a | n/a | `GET /api/v1/projects/export` is not present | n/a | n/a | n/a | n/a | n/a | Outside-main branches only |
| No reports CSV export route | n/a | n/a | `GET /api/v1/reports/export` is not present | n/a | n/a | n/a | n/a | n/a | Outside-main branches only |
| Export job handler | `apps/web/lib/platform/jobs/job.handlers/export.ts` | internal job | Current export job path exists as platform job handling, not public route export | job result payload / backend-generated output when implemented | job/service scoped, not HTTP route | internal job context | job state/result side effects | job handler/export sink tests exist in platform area | admin/export jobs |

## Report Routes In Main

| Route/path | File | Method | Current behavior | Data returned | Auth/tenant check | Role check | Side effects | Tests | Consumers |
|---|---|---|---|---|---|---|---|---|---|
| `/api/v1/reports` | `apps/web/app/api/v1/reports/route.ts` | GET | Tenant-scoped report list with query filters: `project_id`, `worker_id`/`user_id`, `from`, `to`, `limit`, `status`, `q` | report rows enriched with `media_count` and `analysis_status` | `getTenantContextFromRequest`, `requireTenant`, request-bound Supabase | No explicit manager-only check in route; repository should remain tenant-scoped | reads reports/media/jobs | covered indirectly by tests and route inventory | dashboard/manager report lists |
| `/api/v1/reports/[id]` | `apps/web/app/api/v1/reports/[id]/route.ts` | GET | Tenant-scoped report detail with media URLs | report fields + `media` | `getTenantContextFromRequest`, `requireTenant` | lite worker can read only own report; non-reviewers can read only own report; reviewers can read tenant reports | reads report/media | `apps/web/app/api/v1/reports/[id]/route.test.ts` | dashboard, manager, mobile worker read scope |
| `/api/v1/projects/[id]/reports` | `apps/web/app/api/v1/projects/[id]/reports/route.ts` | GET | Project-scoped paginated reports list | rows + total | `getTenantContextFromRequest`, `requireTenant`, `getProject` | project access enforced by `getProject` | reads reports | project route tests nearby | project dashboard/report panels |
| `/api/v1/worker/report/create` | `apps/web/app/api/v1/worker/report/create/route.ts` | POST | Lite worker report draft creation | created report data | `getTenantContextFromRequest`, `requireTenant`, lite idempotency | `createReport` policy requires report create rights | creates `worker_reports` draft | route/service tests | iOS/Android Worker |
| `/api/v1/worker/report/submit` | `apps/web/app/api/v1/worker/report/submit/route.ts` | POST | Lite worker report submit | `{ reportId, jobIds, status: "queued" }` | `getTenantContextFromRequest`, `requireTenant`, lite idempotency | `submitReport` policy and ownership | updates report, queues jobs | route tests | iOS/Android Worker |
| `/api/v1/worker/report/add-media` | `apps/web/app/api/v1/worker/report/add-media/route.ts` | POST | Adds media/upload session to worker report | success data | tenant context + route policy | worker/report ownership expected | inserts media relation | route/service tests | iOS/Android Worker |

## Report Review Route In Main

| Route/path | File | Method | Current behavior | Data returned | Auth/tenant check | Role check | Side effects | Tests | Consumers |
|---|---|---|---|---|---|---|---|---|---|
| `/api/v1/reports/[id]` | `apps/web/app/api/v1/reports/[id]/route.ts` | PATCH | Manager review: `approved`, `rejected`, `changes_requested`; note required for reject/changes_requested | updated report + media | `getTenantContextFromRequest`, `requireTenant` | `canReviewReport(ctx)` -> project management roles | updates report review fields, emits audit event | `apps/web/app/api/v1/reports/[id]/route.test.ts`, policy tests | manager report review UI |

## Current Finance / Customer Safety Guardrails
- `apps/web/lib/security/customer-finance-guard.ts` forbids keys like `planned_amount`, `actual_amount`, `margin`, `budget_pressure`, `subcontractor_cost`, and `ai_finance_risk` on customer-facing payloads.
- Existing portal route tests assert forbidden internal finance keys are blocked.

## Inventory Verdict
- Main has report CRUD/review flows.
- Main does not have safe CSV export routes for projects/reports.
- Any export implementation must be additive and test-first.
