# Wave 4 Step 1 — Integration (Stage E)

## Where milestones appear

1. **GET `/api/v1/projects/:id/summary`**
   - Adds **`overdueMilestonesCount`** to aggregate counts.
   - **`deriveProjectStatus`** receives it and appends **`attentionItems`** including **`overdue_milestones`** when count &gt; 0.

2. **Project detail dashboard**
   - **Milestones** summary card shows overdue context + deep link to Schedule tab.
   - **Schedule** tab hosts full milestone panel.

3. **Tasks**
   - Existing **`/dashboard/tasks?project_id=&milestone_id=`** flow for linking tasks (unchanged contract).

4. **AI Brain**
   - `project-truth-snapshot.assembler.ts` passes `overdueMilestonesCount` into `deriveProjectStatus`.
   - `milestone-pressure.service.ts` filters active statuses consistently.

## Intentionally not touched

- **Project “Needs attention” block** (`/api/v1/projects/:id/attention`) — still driven by its own repository; **does not** automatically ingest `summary.attentionItems` from the client today. Overdue milestones are visible via **summary card + Schedule tab + API `attentionItems` for consumers that read summary JSON**.
- **Worker mobile apps** — out of Wave 4 Step 1 scope.
- **Approvals, documents, budget, contracts** — not modified for schedule.

## P1 follow-up (integration)

- Surface **`attentionItems` from summary** in dashboard UI **or** add overdue milestones to the **attention** API so the “Needs attention” block stays one mental model.
