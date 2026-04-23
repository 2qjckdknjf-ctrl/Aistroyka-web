# Wave 2 — Change log

| File | Type | Reason |
|------|------|--------|
| `apps/web/app/api/v1/projects/[id]/reports/route.ts` | code | Use `createClientFromRequest(request)` so project report listing respects Bearer JWT + RLS (Manager/mobile/API clients). |
| `apps/web/app/api/v1/projects/[id]/uploads/route.ts` | code | Same for upload-session listing scoped to project. |
| `apps/web/app/api/v1/reports/[id]/analysis-status/route.ts` | code | Same for analysis job aggregation read; rename handler param to `request` for clarity. |

No changes to `lib/domain/**` report/project services, middleware, or lite allow-list in this wave.
