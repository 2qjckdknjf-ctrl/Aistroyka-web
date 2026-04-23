# Wave 4 Step 2 — Approval inventory (Stage A)

**Date:** 2026-03-28  
**Scope:** Governance on existing work artifacts only (no document BPM, no cost).

## A1. Candidates reviewed

| Entity | Existing state machine | Manager API | Product fit |
|--------|------------------------|-------------|-------------|
| **Worker reports** (`worker_reports`) | `draft` → `submitted` → `approved` \| `rejected` \| `changes_requested` | PATCH `/api/v1/reports/:id` | **High** — core field proof loop |
| Milestone status | `planned` … (Wave 4 Step 1) | Milestone PATCH | Lower priority; status is planning, not worker deliverable |
| Project documents | Separate `under_review` flow | Document routes | **Out of scope** for this step (explicit mission) |

## A2. Scope chosen: **worker reports**

**Why:** Smallest end-to-end artifact that already ties workers, tasks/days, media proof, and manager review. Highest clarity: submit → decide → optional resubmit.

## A3. Deferred

- **Documents / acts / contracts** — separate domain; would duplicate “approval” UX without shared table.
- **Milestone “approval”** — would blur schedule governance with proof review; use report approval first.
- **Budget / ERP / Android** — excluded by mission.

## A4. Justified states (report row)

| State | Meaning |
|-------|---------|
| `draft` | Worker editing |
| `submitted` | Awaiting manager decision |
| `approved` | Accepted |
| `rejected` | Not accepted (terminal unless product adds reopen — not in this step) |
| `changes_requested` | Worker must revise; may resubmit to `submitted` |

**Note:** “Draft” in the mission text maps to worker **draft** on the report, not a separate global approval draft entity.
