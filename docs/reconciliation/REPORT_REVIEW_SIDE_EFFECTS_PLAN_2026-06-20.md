# Report Review Side Effects Plan — 2026-06-20

Current main already supports report review transitions and audit logging. Outside-main branches propose extra approval-history, sync, and notification side effects.

## Action Matrix

| Action | Expected DB write | Expected audit log | Expected notification | Expected sync effect | Expected export visibility | Tests required |
|---|---|---|---|---|---|---|
| `approved` | update `worker_reports.status`, `reviewed_at`, `reviewed_by`, `manager_note` nullable | `report_review` audit with status and note presence | Later: notify report author only, tenant scoped | Later: emit report updated change | CSV shows `approved`, review timestamp/reviewer; no notes in first slice | route PATCH approve, audit emitted, no cross-tenant update |
| `rejected` | same fields, status `rejected`, manager note required | `report_review` audit | Later: notify report author with safe message | Later: emit report updated change | CSV shows `rejected`; do not export manager note first | note-required test, audit emitted, no cross-tenant update |
| `changes_requested` | same fields, status `changes_requested`, manager note required | `report_review` audit | Later: notify report author with safe message | Later: emit report updated change | CSV shows `changes_requested`; do not export manager note first | note-required test, worker resubmit compatibility |
| `reviewed` conceptual state | represented by `reviewed_at`/`reviewed_by` | included in audit details | no direct notification | no direct sync unless status transition emits | safe metadata for manager/admin CSV | field shape tests |

## Existing Main Side Effects
- Updates `worker_reports`.
- Emits audit event via `emitAudit`.
- Returns updated report with media.

## Outside-Main Proposed Side Effects
- `insertReportApprovalEvent`
- `emitChange` to sync change log
- `notifyUser` to report author

## Dependencies To Review Before Porting Side Effects
- report approval events table/repository exists and is tenant scoped
- sync change log event shape is stable for mobile clients
- notification insert helper prevents cross-tenant target leakage
- duplicate PATCH retry behavior does not create duplicate approval events
- failed side-effect behavior is defined: all-or-nothing or best-effort

## Export Impact
- First export slice should include review status/timestamps only.
- Manager note should be excluded from first CSV to avoid free-text leakage.
- Notification/audit/sync side effects are not required for read-only report export.

## Plan Verdict
- Report review side effects are partially understood.
- Do not port side effects in the first export slice.
- Add side-effect tests before any report PATCH behavior expansion.
