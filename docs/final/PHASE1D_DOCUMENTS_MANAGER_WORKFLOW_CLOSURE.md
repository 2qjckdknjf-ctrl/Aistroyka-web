# Phase 1D — Documents & manager approvals workflow (closure audit)

**Project:** Aistroyka web (`apps/web`)  
**Method:** Code-path trace (App Router UI + `/api/v1` routes + domain services)  
**Date:** 2026-03-23  
**Staging / production exercise:** Not run in this heartbeat; conclusions are **repo truth** unless noted.

---

## Verdict (manager-facing story)

**NO** — two different “approval” surfaces exist; one is complete for managers, the other is only **partially** aligned with that bar.

---

## 1. Global “Approvals” page (`/dashboard/approvals`)

| Aspect | Repo state |
|--------|------------|
| **Purpose** | **Daily reports only** — subtitle and client load `GET /api/v1/reports?status=submitted`. |
| **UX** | Queue → link to `/dashboard/reports/[id]` → `ReportApprovalCard`: approve, reject, request changes, optional note. |
| **API** | `PATCH /api/v1/reports/[id]` (manager-gated per `report.policy`); approval history route exists. |

**Assessment:** **End-to-end in code** for the **report** workflow (queue + review + three outcomes + note on request-changes). Does **not** surface project documents.

---

## 2. Project documents (manager path)

| Step | Repo state |
|------|------------|
| List / CRUD | `ProjectDocumentsPanel`: list via `GET .../documents`, create, upload, status updates via `PATCH .../documents/:id`. |
| Lifecycle | `draft` → `uploaded` → `under_review` (submit / resubmit) governed by `document.policy` + `document.service` (`canManageProjects`). |
| Manager decision | For `under_review`, UI offers **Approve** and **Reject** only — **no “Request changes”** and **no comment** on PATCH (route does not accept `decision_comment` / `decided_by` in body today). |
| Audit / history | `GET .../documents/:id/approval-history` maps `audit_logs` (`document_*` actions). `DocumentApprovalHistory` modal consumes it. |
| Notifications | Submit/resubmit notify owners; owner decisions notify managers (`document-decision.service` + `manager-notifications.repository`). |

**Assessment:** **Partial.** Managers can close the loop with approve/reject, but parity with report review (three outcomes + note) is **missing** on this panel.

---

## 3. Project owner decision path (not “manager” but same document object)

| Aspect | Repo state |
|--------|------------|
| API | `POST .../documents/:documentId/decision` — `requireProjectOwner`; actions `approve` \| `reject` \| `request_changes`; optional `comment`; sets `decision_comment` / `decided_by`. |
| UI | `OwnerViewClient` uses this path for pending documents. |

**Assessment:** **End-to-end for project owners** in code. This is a **second** decision path alongside manager `PATCH` status transitions — product should treat role boundaries as intentional or tighten policy in a follow-up.

---

## 4. Plan / entitlements surface

`InlineUpgradeHint` on approvals page keys off `advancedApprovals`; document features also appear in plan-fit copy. **No code change required for this audit** — note only that marketing/entitlement strings may imply breadth beyond “reports-only” on `/dashboard/approvals`.

---

## OPEN (if pursuing YES on unified manager documents + approvals)

1. **Project documents — manager UI:** Add **Request changes** and capture **review note** (either extend `PATCH` body + service, or call a single shared “review” abstraction used by owners).
2. **Navigation / mental model:** Either rename/clarify `/dashboard/approvals` as report-centric, or add a cross-project “documents awaiting review” view (product decision).
3. **Governance clarity:** Document or enforce whether **manager PATCH** vs **owner `decision`** is authoritative when both roles exist on a project.
4. **Live proof:** Run one tenant through report submission + document submit-for-review + both decision paths on staging or production and attach evidence to the parent sprint issue.

---

## References (canonical paths)

- Approvals hub: `apps/web/app/[locale]/(dashboard)/dashboard/approvals/`
- Report review UI: `apps/web/components/approvals/ReportApprovalCard.tsx`
- Project documents UI: `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectDocumentsPanel.tsx`
- Document PATCH: `apps/web/app/api/v1/projects/[id]/documents/[documentId]/route.ts`
- Owner decision: `apps/web/app/api/v1/projects/[id]/documents/[documentId]/decision/route.ts`
- Document domain: `apps/web/lib/domain/documents/document.service.ts`, `document-decision.service.ts`, `document.policy.ts`
- Approval history API: `apps/web/app/api/v1/projects/[id]/documents/[documentId]/approval-history/route.ts`
