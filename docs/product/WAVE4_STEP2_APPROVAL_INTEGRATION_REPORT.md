# Wave 4 Step 2 — Integration (Stage E)

## Integrated surfaces

1. **Project summary API** (`GET /api/v1/projects/:id/summary`)  
   - Adds **`pendingReportApprovalsCount`**.  
   - **`deriveProjectStatus`** adds **`attentionItems`** entry `pending_report_approvals` when count &gt; 0.

2. **Project detail dashboard**  
   - Open reports card + workload/governance block (see UI report).

3. **AI Brain truth snapshot**  
   - `assembleProjectTruthSnapshot` passes **`pendingReportApprovalsCount`** into **`deriveProjectStatus`**.

## Intentionally not touched

- **Document** approval/decision routes (`project_documents`) — out of scope.
- **Cost / billing** — out of scope.
- **`/api/v1/projects/:id/attention`** repository — not merged with summary attention in this step (summary-derived items are shown in a separate “Workload & governance” block).

## P1 follow-up

- Filter **approval queue** by `project_id` query param for deep links from project detail.
