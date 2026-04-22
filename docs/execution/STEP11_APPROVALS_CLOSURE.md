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

- Staging runtime mismatch (`/api/v1/approvals/pending` returns `404` on staging while production path returns `401`).
- Verified deploy-state evidence: latest successful staging deploy run (`24616054744`) is pinned to old SHA `d74657e`, which does not contain current approvals queue route in repository history.

## Closure Verdict

**NO** (single deployment/runtime parity blocker).

