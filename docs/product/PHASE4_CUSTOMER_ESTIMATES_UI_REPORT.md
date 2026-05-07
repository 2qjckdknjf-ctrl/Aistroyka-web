# Phase 4 Customer Estimates UI Report

Date: 2026-05-07 (updated)

Roadmap phase: 4 - Customer Estimates / Commercial Approvals

## Manager UI

- **`CustomerEstimatesManagerPanel`** is embedded at the top of the project **Estimate** tab (`ProjectEstimatePanel`), above internal/AI cost intelligence — clearly separated copy.
- Managers can: create draft, **edit draft** (PATCH), **cancel draft**, send for approval (creates linked `estimate_approval` decision request), optional linked document id, validity date.
- Strings use `dashboardDetail.customerEstimates*` (en / ru / es / it).

## Customer UI

- **`ClientProjectView`** now includes `customer_estimates` from `listCustomerEstimates(..., "customer")` (sent+ statuses).
- **`ClientPortalCustomerEstimatesSection`** on the client portal home lists estimates and, when `status === sent` and `can_respond_to_requests`, provides approve/reject with optional note via `POST /api/v1/projects/:id/estimates/:estimateId/respond`.
- Approved flows still materialize customer-facing commercial lines per existing `respondToCustomerEstimate` logic.

## APIs (manager)

- `PATCH /api/v1/projects/:id/estimates/:estimateId` — draft field edits or `status: cancelled` from draft.

## Phase 4 Verdict

**PHASE 4 CLOSED: YES** — manager + customer surfaces aligned with customer-finance-safe roadmap.
