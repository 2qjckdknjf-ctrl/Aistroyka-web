# Integration Code Review — 2026-06-20

## Reports Export
- Route exists: YES, `GET /api/v1/reports/export`.
- Tenant scoped: YES, tenant ID comes from server-side tenant context.
- Project scoped: YES when `project_id` is supplied; project is validated with existing project access helper.
- Owner/admin tenant-wide behavior safe: YES, tenant-wide export is limited to tenant `owner`/`admin`.
- Manager/admin project behavior safe: YES under owner/admin gate; generic `member` cannot export.
- Worker/customer/stakeholder blocked: YES.
- CSV safe fields only: YES.
- Finance fields absent: YES.
- Media URLs absent: YES.
- Notes absent: YES.
- Formula injection handled: YES.
- Tests cover behavior: YES.

## Report Review
- Allowed statuses locked: YES, `approved`, `rejected`, `changes_requested`.
- Invalid status rejected: YES.
- Manager note rules locked: YES; required for `rejected` and `changes_requested`, optional for `approved`.
- Unauthorized/lite worker blocked: YES.
- Cross-tenant blocked: YES via tenant-scoped update returning no row.
- Audit emitted only after successful review: YES, tests assert no audit on failed paths and exact audit payload on success.
- No new notifications/sync/AI side effects: YES.
- Tests cover behavior: YES.

## Tenant / Security Verdict
- No anonymous export/review.
- No worker export.
- Lite worker review explicitly blocked.
- No customer/stakeholder export.
- No service-role response leakage.

## Side Effects
- Reports export is read-only.
- Report review keeps existing audit side effect only.
- Notifications and sync remain deferred.
