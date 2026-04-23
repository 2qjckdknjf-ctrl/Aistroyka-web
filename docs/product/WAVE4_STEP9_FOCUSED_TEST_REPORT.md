# Wave 4 Step 9 — Focused test report (Stage B)

## Commands run

```bash
cd apps/web && npm test -- \
  lib/domain/projects/stakeholder-activity-timeline.repository.test.ts \
  "app/api/v1/projects/[id]/stakeholder-activity/route.test.ts" \
  lib/domain/client-requests/client-requests.service.test.ts
```

(Third file included after adding `listEventsForProject` to the client-requests repository.)

## Result

**PASS** — 3 files, 12 tests (stakeholder-activity route: 3; repository shaping: 2; client-requests service: 7).

## Fixes required during closure

1. **Production build failed** because `listEventsForProject` was imported by `stakeholder-activity-timeline.repository.ts` but **not implemented** on `client-requests.repository.ts`.  
   **Fix:** Added `listEventsForProject` querying `project_client_request_events` by `project_id` + `tenant_id`, newest first, capped limit.

After the fix, focused tests + full suite + build were re-run successfully.
