# Step 11 — Approval Validation Report

**Date:** 2026-03-18

## Commands run

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` (apps/web) | **PASS** |
| `bun test lib/observability/audit.service.test.ts lib/domain/reports/report.policy.test.ts` | **PASS** (7 tests) |
| `npm run test:manager-layer` (existing) | **PASS** (unchanged) |

## Tests added/updated

- **audit.service:** `listAuditLogsForResource` returns events ordered by created_at, filtered by resource_type and resource_id.
- **report.policy:** `canReviewReport` allows member+ (same as canManageProjects), denies viewer.

## Build

- Typecheck confirms no type errors. Full `next build` recommended from repo root for production bundle.

## Focused approval workflow checks

| Check | OK |
|-------|-----|
| Pending list: GET /api/v1/reports?status=submitted | Yes (existing) |
| Review: PATCH /api/v1/reports/:id with status + manager_note | Yes (existing) |
| Audit: report_review emitted with details | Yes (existing) |
| History: GET /api/v1/reports/:id/approval-history | Yes (new) |
| Manager UI: Approvals page, report detail + ReportApprovalCard | Yes (existing) |
| Approval history on report detail | Yes (new ReportApprovalHistory) |
| Project context on approvals list | Yes (project_id in row) |

## Unrelated blockers

- None. Vitest/esbuild on some hosts remains env-specific; Bun test path used for approval-related tests.

## Confidence

**High** — approval scope is single-entity (reports), domain and API are implemented and documented, history is auditable via existing audit_logs and new endpoint.
