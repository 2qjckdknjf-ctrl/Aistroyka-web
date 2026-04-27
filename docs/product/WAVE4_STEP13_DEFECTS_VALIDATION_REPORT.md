# Wave 4 Step 13 — Validation report

## Automated tests added

- `lib/domain/defects/defects.service.test.ts` — create (manager/stakeholder), public vs manager detail, transition resolution note.  
- `lib/domain/project-handover/handover-readiness.test.ts` — `blocking_punch_defects` blocker + ready when zero.  
- `app/api/v1/projects/[id]/defects/route.test.ts` — GET list; POST manager vs stakeholder branching.

## Commands (run locally / CI)

From repo root (or `apps/web` as per workspace):

```bash
cd apps/web && npm exec vitest run lib/domain/defects/defects.service.test.ts lib/domain/project-handover/handover-readiness.test.ts app/api/v1/projects/\[id\]/defects/route.test.ts
npm run build
```

## Focused checks

- After migration apply: create defect as manager → appears in list → transition to resolved requires note → blocking count drops.  
- Stakeholder: POST create from portal → row visible; GET detail has no assignee UUID.

## Note

- Execution of the commands above was not completed in the agent runtime (Node/npm unavailable in the sandbox). **Record actual output in CI or local runs before production promotion.**
