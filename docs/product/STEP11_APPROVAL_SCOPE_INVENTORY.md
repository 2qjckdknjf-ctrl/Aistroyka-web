# Step 11 — Approval Scope Inventory

**Date:** 2026-03-18

## Candidates evaluated

| Entity | Current product role | Approval need | Implementation readiness | Risk | Choose now / defer | Reason |
|--------|----------------------|---------------|---------------------------|------|--------------------|--------|
| **Worker reports** | Daily/field reports; worker submits, manager reviews | Explicit: approve / reject / request changes already in schema and API | **High** — status, PATCH, ReportApprovalCard, DashboardApprovalsClient, audit report_review | Low | **Choose now** | Only entity with full submit → review flow and tenant/role enforcement |
| Manager-reviewed report items (granular) | Not a separate entity | Could be “per-media approval” | No schema; would be new | Medium | **Defer** | Not in current product scope |
| AI-related review checkpoints | AI analysis results | “Approve AI finding” could exist | No approval table for analyses; would be new workflow | Medium | **Defer** | Not justified by current repo; recommendations are advisory |
| Documents (project_documents) | Project docs | Future “doc approval” | Table exists; no approval status or API | Low | **Defer** | No approval semantics in codebase yet |
| Invitations / tenant | Invite accept | Already a flow, not “approval” in same sense | N/A | — | **Defer** | Different pattern (invitee accepts) |

## Chosen approval scope

**Worker reports only.** One target entity, explicit status model (draft → submitted → approved | rejected | changes_requested), resubmit from changes_requested, manager_note, reviewed_at/reviewed_by, audit report_review, and existing manager UI.

## Biggest deferred items

- Per-document or per-media approval.
- AI recommendation “approval” as a first-class workflow.
- Multi-step or multi-approver flows.
