# Wave 4 Step 11 — Governance report (Stage C)

## C1. Lifecycle

| Status | Meaning |
|--------|---------|
| `draft` | Internal preparation; **hidden** from stakeholder list/detail. |
| `proposed` | Published for review (stakeholder-visible when not draft). |
| `under_review` | Active review. |
| `approved` | Accepted change. |
| `rejected` | Not proceeding (can be reworked per transitions). |
| `implemented` | Executed on site / in plan (implementation timestamp set). |
| `archived` | Closed record. |

## C2. Who can do what

| Action | Actor |
|--------|--------|
| Create, PATCH content, transition | Manager (`canManageClientRequests` aligned with portal governance). |
| Read list/detail | Manager + portal stakeholder (`canReadClientPortalView`). |
| Stakeholder sees draft | **No** — filtered in service. |

## C3. Approval / decision linkage

- Formal **approval** is expressed via **status transitions** (`approved`, `rejected`, `implemented`), not a separate legal approvals engine.
- Optional **links** to discussions/requests/documents provide traceability; they do not auto-sync status from those systems in this step.

## C4. Traceability

- Every transition (except initial create of `proposed` with opening event) records `project_change_order_events` with actor and optional note.
- **Stakeholder-facing** detail maps events to **public** shape: **transition notes are stripped** from the portal JSON to avoid leaking internal negotiation text; status transitions remain visible.
