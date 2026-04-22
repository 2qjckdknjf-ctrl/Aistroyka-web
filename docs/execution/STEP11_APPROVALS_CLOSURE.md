# STEP11 APPROVALS CLOSURE

## Goal

Close approval semantics and manager workload surface as an operational loop.

## Starting Truth

- Repo already had report approval states (`approved/rejected/changes_requested`) and resubmit support in worker submit flow.
- Unified queue endpoint existed (`/api/v1/approvals/pending`) but manager page still read only submitted reports.

## What Was Changed

- Updated manager approvals page client to use unified queue endpoint:
  - `apps/web/app/[locale]/(dashboard)/dashboard/approvals/DashboardApprovalsClient.tsx`
- Queue now renders both:
  - report approvals
  - document approvals (`under_review`)
- Kept lightweight governance model (no BPM expansion).

## Semantics State

- Reject semantics: explicit and retained.
- Changes-requested + resubmit semantics: explicit in report service path (`draft/changes_requested -> submitted` flow).
- Manager queue/workload surface: strengthened by unified queue wiring.

## What Remains

- No remaining runtime mismatch.
- Final live proof on staging (run `24779302464`, SHA `b2b316df`):
  - unauthenticated `GET /api/v1/approvals/pending` => `401`
  - authenticated `GET /api/v1/approvals/pending?limit=10` => `200`

## Closure Verdict

**YES**.

