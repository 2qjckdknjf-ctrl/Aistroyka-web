# Wave 4 Step 2 — Executive summary

## Shipped

- **Append-only `report_approval_events`** with tenant-member read access, fixing approval history visibility where `audit_logs` SELECT was admin-only.
- **Automatic event writes** on submit, resubmit, and manager PATCH (approve / reject / request changes).
- **GET approval-history** prefers new table; legacy audit shape when empty.
- **Project summary:** `pendingReportApprovalsCount` + derived attention + project dashboard **Workload & governance** strip.
- **PATCH audit** details include full `note` for reviews.
- **ReportApprovalCard** sends notes for reject and request changes (optional approve note).

## Documents

| File |
|------|
| `WAVE4_STEP2_APPROVAL_INVENTORY.md` |
| `WAVE4_STEP2_APPROVAL_BACKEND_REPORT.md` |
| `WAVE4_STEP2_APPROVAL_AUDIT_REPORT.md` |
| `WAVE4_STEP2_APPROVAL_UI_REPORT.md` |
| `WAVE4_STEP2_APPROVAL_INTEGRATION_REPORT.md` |
| `WAVE4_STEP2_APPROVAL_VALIDATION_REPORT.md` |
| `WAVE4_STEP2_APPROVAL_POST_AUDIT.md` |
| `WAVE4_STEP2_APPROVAL_SUMMARY.md` (this file) |
