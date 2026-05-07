# Phase 3 — Decision requests completion report

**Phase:** 3 — Decision requests  
**Date:** 2026-05-07  
**Verdict:** **YES**

## What shipped

1. **Domain** — `project_client_requests` + `project_client_request_events`; Phase 3 types on `decision_type`, commercial amount rules, linked entities.  
2. **Manager API** — `GET/POST /api/v1/projects/:id/decision-requests`, `GET/PATCH .../decision-requests/:requestId`.  
3. **Customer API** — `GET /api/v1/portal/projects/:id/decisions`; `POST .../decisions/:requestId/respond` (portal alias).  
4. **Manager UI** — Decisions tab + `ProjectDecisionsPanel` (list, create, overdue highlight, portal link).  
5. **Workload** — Open customer decisions; overdue escalates to urgent / `due_state: overdue` / `?tab=decisions`.  
6. **Audit** — State changes emit events; payloads enriched (see `docs/audit/PHASE3_CLIENT_REQUEST_EVENTS_AUDIT.md`).  
7. **Estimate response integrity** — Customer estimate respond path checks linked decision `respondToClientRequest` result before updating estimate row.

## Intentional deviations from roadmap literals

- Table name is `project_client_requests`, not `decision_requests`.  
- Customer URLs/APIs use **`/portal`** namespace, not `/owner` (reserved for platform owner).  
- Status vocabulary is `open/responded/completed/cancelled`, not the illustrative `pending/approved/...` list in the roadmap.

## Closure criteria (roadmap §770–777)

| Criterion | Status |
|-----------|--------|
| Manager can create decision request | YES |
| Customer can respond | YES |
| Status updates | YES |
| Audit trail exists | YES |
| No internal finance fields to owner/customer | YES |
| Manager sees pending/overdue | YES |

**PHASE 3 CLOSED: YES**
