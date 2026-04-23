# Wave 4 Step 16 — Integration

## F1 — Sources wired

| Source | Workload kinds |
|--------|----------------|
| Project summary repository | overdue milestones, pending document decisions, budget flag, pending reports aggregate |
| Handover readiness | blocking defects, handover_not_ready |
| `project_stakeholder_discussions` | discussion_awaiting_manager, discussion_awaiting_stakeholder |
| `project_client_requests` | client_request_action (stakeholder) |
| `project_service_requests` | aftercare_needs_action |
| Portfolio control service | portfolio_critical (leadership) |

## F2 — Alignment

- Drilldowns use existing project detail query params and client routes established in prior waves.
- No duplicate write paths; inbox is read-only.

## F3 — Not touched

- Change order domain as a first-class workload source
- Notification center semantics (separate from this inbox)
- Mobile apps
