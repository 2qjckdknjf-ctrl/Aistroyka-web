# Wave 4 Step 9 — Build validation report (Stage D)

## Command

```bash
cd /path/to/AISTROYKA && npm run build
```

## Initial result (pre-fix)

**FAIL** — Next.js compile/typecheck:

- `listEventsForProject` is not exported from `client-requests.repository` (imported by `stakeholder-activity-timeline.repository.ts`).

## Fix (minimal)

- Implemented and exported `listEventsForProject` in `apps/web/lib/domain/client-requests/client-requests.repository.ts`.

## Final result (post-fix)

**PASS** — `NODE_ENV=production next build` completed successfully; route list includes `/api/v1/projects/[id]/stakeholder-activity`.

## Fixes needed

None remaining for Step 9 build path after the repository export.
