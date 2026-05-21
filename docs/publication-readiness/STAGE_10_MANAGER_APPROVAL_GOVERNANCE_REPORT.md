# STAGE 10 — Manager Review / Approval / Governance Report

## 1. Goal

Harden manager review transitions (approve/reject/request changes), improve auditability evidence, and close coverage gaps in governance behavior.

## 2. Files inspected

- `apps/web/app/api/v1/reports/[id]/route.ts`
- `apps/web/app/api/v1/reports/[id]/approval-history/route.ts`
- `apps/web/lib/domain/reports/report.service.ts`
- `apps/web/lib/domain/reports/report.repository.ts`
- `apps/web/lib/domain/reports/report.policy.ts`
- `apps/web/lib/domain/reports/report-approval.repository.ts`
- `apps/web/app/[locale]/(dashboard)/dashboard/approvals/DashboardApprovalsClient.tsx`

## 3. Findings

1. Review API enforces manager/admin permission checks through `canReviewReport`.
2. Transition policy is explicit:
   - allowed review statuses: `approved`, `rejected`, `changes_requested`
   - reject/changes_requested require `manager_note`
3. Review updates write `reviewed_by`, `reviewed_at`, and `manager_note`.
4. Resubmit loop exists in service layer (`changes_requested` -> `submitted` via `resubmit` path), but dedicated test coverage was missing.

## 4. Changes made

1. Added route-level manager review tests:
   - `apps/web/app/api/v1/reports/[id]/route.test.ts`
   - covers:
     - unauthorized review attempt (403)
     - missing note for `changes_requested` (400)
     - wrong tenant/project / non-submitted path via repo miss (404)
     - successful approve transition with audit/media payload (200)
2. Added resubmit-loop coverage:
   - updated `apps/web/lib/domain/reports/report.service.task-link.test.ts`
   - validates `changes_requested` reports call `resubmit` (not `submit`).

## 5. Validation commands

```bash
bun run --cwd apps/web test "app/api/v1/reports/[id]/route.test.ts" lib/domain/reports/report.service.task-link.test.ts
```

## 6. Validation result

- Passed (`15/15` tests).
- Transition and governance coverage materially improved for review and resubmit flows.

## 7. Remaining gaps

1. End-to-end UI runtime verification of manager approval queue on live tenant data remains pending.
2. Full cross-route governance consistency audit beyond report transitions is still pending.

## 8. Blockers

- None for repository-local manager review governance hardening.

## 9. Commit hash

Pending (generated after commit).

## 10. Push status

Pending (will push immediately after stage commit).

## 11. Stage verdict

CLOSED

