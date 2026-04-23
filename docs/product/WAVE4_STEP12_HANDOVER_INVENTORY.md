# Wave 4 Step 12 — Handover scope inventory (Stage A)

## A1. Systems that feed readiness

| Source | Use in readiness |
|--------|------------------|
| Milestones | Overdue active milestones (same rule as project summary). |
| Documents | Any non–`approved` / non–`archived` status blocks (draft, uploaded, under_review, rejected, changes_requested). |
| Change orders | Non-terminal change orders block (`draft`, `proposed`, `under_review`, `approved`). |
| Stakeholder discussions | Open threads (`open`, `awaiting_stakeholder`, `awaiting_manager`). |
| Client requests | `status = open` and `action_mode = action_required`. |
| Issues | Open / in review (from project summary). |
| Report approvals | Pending submitted reports awaiting manager review (from project summary). |

## A2. Scope chosen: **project-level only**

Milestone-level handover records would duplicate lifecycle and UI surface area. The current architecture already exposes milestone status to managers and stakeholders; **Wave 4 Step 12** adds a **single** `project_handover` row per project plus **computed** readiness. Milestone health remains an **input** to readiness, not a second handover entity.

## A3. Questions answered now

- Is the project **ready for formal handover**? (no blocking items per rules.)
- **What is missing?** (explicit blocker list for managers.)
- Can a manager **advance** `in_progress` → `handover_ready` → `handed_over` → `completed` with audit events?
- What does the **client** see? (status + optional handover note + dates — no internal blocker list.)

## A4. Deferred

- Warranty / aftercare module, asset registry, punch-list product.
- Per-milestone handover records and giant configurable checklist engines.
- Legal pack automation, compliance bundles.
- Notifications dedicated to handover events (not added).
