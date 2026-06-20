# Report Review Expected Contract — 2026-06-20

## A. Allowed Actions / Statuses
- `approved`
- `rejected`
- `changes_requested`
- Invalid or missing status must return 400.
- `reviewed` is not a supported status in current code.

## B. Manager Note
- Required for `rejected`.
- Required for `changes_requested`.
- Optional for `approved`.
- Current route trims string notes and stores `null` for empty/omitted note.
- No maximum length is enforced in the current route; this slice does not add a new limit.

## C. Auth / Access
- Anonymous: blocked by tenant requirement.
- Lite worker client: must be blocked at route level.
- Worker/non-reviewer: blocked by existing review policy.
- Stakeholder/viewer/customer-style roles: blocked by existing review policy.
- Wrong tenant: blocked by tenant-scoped repository update returning no row.
- Wrong project: blocked indirectly by tenant/report update semantics; no project-specific expansion in this slice.
- Manager/admin/current reviewer roles allowed only within tenant scope.

## D. State Changes
- Only submitted reports can transition.
- `status` changes to requested review status.
- `reviewed_at` set by repository.
- `reviewed_by` set to reviewer user ID.
- `manager_note` stored if provided, `null` when approved without note.
- No other fields should be changed by the route.

## E. Audit Log
- Successful review emits audit action `report_review`.
- Audit includes tenant ID, user ID, trace ID, report resource ID, status, and whether a note was provided.
- No audit should be emitted for unauthorized, invalid, or not-found/not-submitted review attempts.

## F. Deferred Side Effects
Explicitly out of scope:
- notifications
- mobile sync event creation
- owner/stakeholder events
- AI re-analysis
- export changes
