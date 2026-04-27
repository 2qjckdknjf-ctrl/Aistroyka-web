# Wave 4 Step 2 — Backend report (Stage B)

## Persistence

### Existing (unchanged contract)

- **`worker_reports`** — canonical status + `reviewed_at`, `reviewed_by`, `manager_note` (see migrations `20260306670000`, `20260307300000`).

### New (Wave 4 Step 2)

- **`report_approval_events`** — append-only rows: `tenant_id`, `report_id`, `event_type` (`submitted` \| `approved` \| `rejected` \| `changes_requested`), `actor_user_id`, `note`, `created_at`.
- **Migration:** `apps/web/supabase/migrations/20260328180000_report_approval_events.sql`
- **RLS:** tenant members may `SELECT` and `INSERT` (no UPDATE/DELETE).

**Why a new table:** `audit_logs` **SELECT** is restricted to owner/admin in existing RLS, so workers and many managers could not read approval history from audit alone.

## Domain modules

| Module | Role |
|--------|------|
| `lib/domain/reports/report.repository.ts` | `submit` / `resubmit` / `updateReview` emit approval events after successful writes |
| `lib/domain/reports/report-approval.repository.ts` | `insertReportApprovalEvent`, `listReportApprovalEvents`, `countSubmittedReportsForProject` |
| `lib/domain/reports/report.policy.ts` | `canReviewReport` → `canManageProjects` |

## API (existing routes, behavior extended)

| Route | Behavior |
|-------|----------|
| `PATCH /api/v1/reports/:id` | Manager: `approved` / `rejected` / `changes_requested` + optional `manager_note`; writes row + **approval event** + `emitAudit` with `{ status, note }` |
| `GET /api/v1/reports/:id/approval-history` | Prefers **`report_approval_events`**; if empty, falls back to **`audit_logs`** legacy shape |

## Project summary

- **`pendingReportApprovalsCount`** — count of `status=submitted` reports linked to the project via `task_id` or `day_id` (deduped by report id).

## Risks

1. **Deploy order:** apply migration before relying on inserts.
2. **Legacy history:** reports with no events yet may show legacy audit data only for users who could already read audit (often empty for non-admin); new events fix forward-looking visibility.
