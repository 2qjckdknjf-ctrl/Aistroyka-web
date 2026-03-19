# Step 11 — Approval Summary

## What approval capability is now real

- **Target:** Worker reports only (single entity, justified by existing schema and flows).
- **Flow:** Worker submits → status “submitted” → manager sees pending on /dashboard/approvals and on report detail → manager approves / rejects / requests changes (with optional note) → audit event + report row updated. Resubmit from “changes_requested” returns report to “submitted.”
- **History:** GET /api/v1/reports/:id/approval-history returns report_submit and report_review events from audit_logs. Report detail page shows “Approval history” section.
- **Integration:** Operations queue and recommendation engine already point to approvals and pending reports; no new pressure signals invented.
- **Docs:** Scope inventory, domain model, audit model, validation report, post-audit, and this summary.

## What remains partial and why

- **Reviewer display name:** History shows user_id prefix; full name would require user resolution (deferred).
- **Other entities:** Documents, AI checkpoints, or multi-step approvals are out of scope and deferred with reasons in the scope inventory.

## Next major step allowed

**YES.** Step 11 is closed. Step 12 (or another major phase) may start when the roadmap calls for it; no approval-layer blocker.

## Exact blockers if not allowed

- N/A — no blockers; Step 11 is closed.
