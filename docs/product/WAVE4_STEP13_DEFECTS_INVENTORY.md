# Wave 4 Step 13 — Defects / punch list scope inventory

## A1. Systems inspected for linkage

| Area | Role for this step |
|------|---------------------|
| Handover / completion | **Primary consumer**: blocking punch items gate readiness (`computeHandoverReadiness`). |
| Stakeholder portal | Read punch list; **create** open, unassigned items (RLS + service). |
| Client requests / discussions / documents | **Optional FKs** on `project_defects` for traceability; not required for MVP. |
| Milestones | Optional `linked_milestone_id`. |
| Project issues (`project_issues`) | **Distinct** operational loop; punch list is separate (Wave 4 Step 13). |
| Timeline / notifications | Not expanded in this step beyond existing patterns (no new defect timeline events). |

## A2. Minimal scope chosen

1. **Manager punch list** — full CRUD workflow: create, list, detail, assign, due date, blocking flag, status transitions, resolution note, audit events (internal).  
2. **Stakeholder reporting** — submit new items (open, unassigned); no internal assignment IDs visible on detail.  
3. **Handover blocking** — `is_blocking` + status in `{ open, in_progress, ready_for_verification }` counts toward readiness blockers.  
4. **Explicit lifecycle** — not a generic “issue” product; table `project_defects` separate from `project_issues`.

## A3. Minimum fields (implemented)

- Title, description, status, `is_blocking`, optional `assigned_to`, `due_date`, optional links (`milestone`, `document`, `discussion`, `request`), `resolution_note`, `resolved_at`, `resolved_by`, `created_by`, timestamps.

## A4. Deferred (explicit)

- Warranty / recurring maintenance tickets.  
- Portfolio-wide QA analytics.  
- SLA / escalation engine.  
- Deep photo markup or field-app redesign.  
- Android-specific expansion.  
- Stakeholder-visible internal event history (managers see `project_defect_events`; public detail omits `assigned_to` UUID and events).  
- Timeline rows for every defect event (optional future).
