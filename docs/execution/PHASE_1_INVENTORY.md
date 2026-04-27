# Phase 1 — Inventory (Approvals Layer Closure)

**Date:** 2026-04-18  
**Stage:** A — Current Truth Inventory  
**Scope lock:** only approvals loop (approve/reject/request_changes/resubmit + manager queue + history).

## What Exists (repo truth)

### Report approvals (core)

- Manager decision API: `PATCH /api/v1/reports/:id` in `apps/web/app/api/v1/reports/[id]/route.ts`.
- Allowed statuses: `approved`, `rejected`, `changes_requested`.
- Transition guard: review allowed only from `submitted`.
- Event logging: `report_approval_events` via `insertReportApprovalEvent`.
- History endpoint: `GET /api/v1/reports/:id/approval-history`.
- Manager UI queue: `apps/web/app/[locale]/(dashboard)/dashboard/approvals/DashboardApprovalsClient.tsx` (currently based on `status=submitted` reports).
- Manager review UI: `apps/web/components/approvals/ReportApprovalCard.tsx`.

### Resubmit path (worker)

- Worker submit endpoint: `apps/web/app/api/v1/worker/report/submit/route.ts`.
- Service-layer logic: `apps/web/lib/domain/reports/report.service.ts` supports submit from:
  - `draft` -> `submitted`
  - `changes_requested` -> `submitted` (via `repo.resubmit`).
- Resubmit behavior test exists: `apps/web/lib/domain/reports/report.repository.resubmit.test.ts`.

### Document decision semantics (parallel approvals contour)

- Owner decision API: `apps/web/app/api/v1/projects/[id]/documents/[documentId]/decision/route.ts`.
- Allowed actions: `approve`, `reject`, `request_changes`.
- Separate document flow exists with its own history endpoints.

## What Is Partial

1. **Manager queue fragmentation**
   - Current approvals queue is report-centric (`/api/v1/reports?status=submitted`), not unified across approval entities.
2. **Explicit reject/request-changes semantics in manager workload**
   - API supports them, but queue UX prioritization/triage semantics are minimal.
3. **Auditability consistency**
   - Report approvals have append-only events; cross-entity approvals history is not unified.
4. **Operational closure evidence**
   - Runtime proofs exist for infra gate, but approvals-loop-specific runtime regression matrix is missing.

## What Is Missing for Phase 1 Closure

1. Single manager-facing approvals workload semantics for pending decisions.
2. Explicit low-friction triage UX for approve/reject/request_changes.
3. End-to-end validation matrix for:
   - submitted -> approved
   - submitted -> rejected
   - submitted -> changes_requested -> resubmit -> approved/rejected
4. Post-audit confirmation that no meaningful approvals tail remains.

## In/Out of Scope (strict)

- **In scope:** approvals semantics + manager queue/workload + history completeness for approval loop.
- **Out of scope:** broad documents expansion, BPM engine, procurement/quality/safety/other future phases.
