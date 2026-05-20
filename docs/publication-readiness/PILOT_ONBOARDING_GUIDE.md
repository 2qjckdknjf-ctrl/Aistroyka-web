# Pilot Onboarding Guide

## 1. Create tenant/company

1. Provision tenant in production/pilot environment.
2. Confirm tenant isolation with manager account login.

## 2. Add managers

1. Invite manager users.
2. Confirm manager can sign in and reach dashboard.

## 3. Add workers

1. Invite worker users.
2. Confirm worker can sign in from web/iOS worker app.

## 4. Create project

1. Manager creates first project from dashboard.
2. Confirm project appears in project list and detail views.

## 5. Create tasks

1. Add tasks for worker execution.
2. Assign tasks to worker users.

## 6. Worker report flow

1. Worker starts day.
2. Worker opens assigned task.
3. Worker creates report.
4. Worker attaches before/after evidence.
5. Worker submits report.

If runtime device testing is unavailable, use:

- `docs/publication-readiness/STAGE_09_WORKER_MANUAL_E2E_SCRIPT.md`

## 7. Manager review flow

1. Manager opens reports inbox.
2. Manager reviews submitted report.
3. Manager runs approve/reject/request changes path.
4. Worker resubmits when `changes_requested`.

## 8. Documents flow

1. Manager creates document metadata (type/title/description).
2. Manager uploads file.
3. Manager verifies status transitions and file link.

## 9. Costs flow

1. Manager opens costs page for project.
2. Create/update cost item (planned/actual/category/status).
3. Verify summary and over-budget indicators.

## 10. AI / intelligence usage

1. Open project copilot.
2. Validate deterministic fallback behavior when provider unavailable.
3. Do not expose internal company finance internals on customer/owner surfaces.

## 11. Known limitations before broad release

- Supabase live migration parity still requires authenticated operator run.
- iOS runtime smoke evidence is still incomplete in this sprint run.
- Android is deferred from first release scope.
- Some live AI provider checks are environment-key dependent.

