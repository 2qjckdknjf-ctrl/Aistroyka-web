# Reports Export Query Scope Review — 2026-06-20

## Reviewed Queries
- `GET /api/v1/reports/export`
- `GET /api/v1/reports/export?project_id=...`
- `GET /api/v1/reports/export?status=...`
- `GET /api/v1/reports/export?from=...`
- `GET /api/v1/reports/export?to=...`
- `GET /api/v1/reports/export?range_days=...`

## Findings
- `project_id` was optional in the initial implementation.
- Optional `project_id` means tenant-wide export.
- Tenant-wide export is only acceptable for tenant `owner`/`admin`, not generic project managers or workers.
- Initial query parsing silently ignored invalid `range_days` and accepted arbitrary status/date strings.

## Fixes
- Explicit role gate now restricts all export access to `owner`/`admin`.
- Project-filtered export validates project access with `getProject`.
- `status` is restricted to known report statuses:
  - `draft`
  - `submitted`
  - `approved`
  - `rejected`
  - `changes_requested`
- `from` and `to` must parse as valid dates.
- `range_days` must be numeric and is capped to 1..365.

## Answers
1. Is `project_id` required? NO.
2. If optional, who can export without `project_id`? Only tenant `owner`/`admin`.
3. Does no `project_id` export all tenant reports? YES, but only within server tenant context and owner/admin role.
4. Is tenant-wide export allowed for manager? Only if the authenticated tenant role is `owner`/`admin`.
5. Is tenant-wide export allowed only for tenant admin/owner? YES.
6. Are date filters bounded? Date validity is checked; row count is capped.
7. Is `range_days` capped? YES, 1..365.
8. Invalid dates handled safely? YES, 400.
9. Huge exports limited? YES, service caps at 1000 rows.
10. Errors safe and non-leaky? YES, generic errors.

## Decision
- Behavior was too broad for member/project-manager style roles and was hardened.
- Current query scope is acceptable for owner/admin-only export.
