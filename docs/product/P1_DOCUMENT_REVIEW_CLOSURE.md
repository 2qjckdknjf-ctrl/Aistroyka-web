# P1 — Document Review / Approve / Reject Closure

**Date:** 2026-07-02  
**Area:** Task C — document lifecycle for manager review  
**Verdict:** **FULL** for pilot operations

---

## Lifecycle coverage

| Status | Supported | Transition in |
|--------|-----------|---------------|
| draft | ✅ | create |
| uploaded | ✅ | upload route |
| under_review | ✅ | submit action (UI + PATCH) |
| approved | ✅ | decision route / PATCH |
| rejected | ✅ | decision route / PATCH |
| changes_requested | ✅ | decision route / PATCH / UI modal (P1) |
| archived | ✅ | PATCH when policy allows |

Policy source: `apps/web/lib/domain/documents/document.policy.ts`

---

## Required UI / actions

| Action | Status | Location |
|--------|--------|----------|
| Move to under_review | ✅ | Submit for review button → PATCH status |
| Approve | ✅ | Decision modal → `approved` |
| Reject with note | ✅ | Decision modal → `rejected` + `decision_comment` |
| Request changes with note | ✅ | **P1:** `DecisionCommentModal` + PATCH `changes_requested` |
| Status visible in project documents | ✅ | Status column + badges |
| Audit / history | ✅ | `insertDocumentEvent()` + `DocumentApprovalHistory` component |

---

## API paths

- `PATCH /api/v1/projects/[id]/documents/[documentId]` — status + comment fields
- `POST /api/v1/projects/[id]/documents/[documentId]/decision` — explicit approve/reject/request_changes
- `GET .../approval-history` — timeline for UI

---

## P1 changes

1. **Request changes** exposed in `ProjectDocumentsPanel.tsx` (parity with reports).
2. Re-upload enabled after `changes_requested` (see upload closure doc).
3. `commentRequired` i18n key added (`en/ru/es/it`).

---

## Gaps (non-blocking)

| Gap | Classification |
|-----|----------------|
| Owner bulk RPC vs manager PATCH authority nuance | P1 design note — not pilot blocker |
| Approval history may merge audit_logs + events | PARTIAL read path — UI still shows history |

---

## Closure verdict

**FULL** — Governed review lifecycle complete for manager pilot use.
