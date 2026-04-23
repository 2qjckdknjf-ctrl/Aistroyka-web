# Wave 4 Step 12 — Integration report (Stage F)

## F1. Connected domains

Readiness **reads** milestones, documents, change orders, discussions, client requests, issues, and report approvals via existing tables and `getProjectSummary`.

## F2. Timeline

**`stakeholder-activity-timeline.repository.ts`** emits:

- `handover_ready`
- `handed_over`
- `project_completed`

from `project_handover_events` (recent window). Links to the client portal root for simplicity.

## F3. Not integrated (by design)

- Project **`/summary`** JSON — no new aggregate fields in this step.
- Dedicated **notifications** for handover — not added.
- **Warranty** or **defects** products.
