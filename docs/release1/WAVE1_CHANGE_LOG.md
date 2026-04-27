# Wave 1 — Change log

| File | Type | Reason |
|------|------|--------|
| `apps/web/app/api/v1/workers/[userId]/summary/route.ts` | code | Use `createClientFromRequest(request)` so RLS-bound queries run under the same JWT as tenant context (Bearer-safe). |
| `apps/web/app/api/v1/workers/[userId]/days/route.ts` | code | Same. |
| `apps/web/app/api/v1/projects/[id]/workers/route.ts` | code | Same for project worker listing. |
| `apps/web/app/api/v1/sync/bootstrap/route.ts` | code | Same for mobile sync bootstrap. |
| `apps/web/app/api/v1/sync/changes/route.ts` | code | Same for sync delta reads. |
| `apps/web/app/api/v1/sync/ack/route.ts` | code | Same for sync cursor ack. |
| `apps/web/app/api/v1/sync/changes/route.test.ts` | test | Mock `createClientFromRequest` to match route implementation. |
| `apps/web/app/api/v1/sync/ack/route.test.ts` | test | Same. |

No config, middleware, `lib/tenant/**`, or `lib/supabase/**` source edits beyond route imports (uses existing `createClientFromRequest`).
