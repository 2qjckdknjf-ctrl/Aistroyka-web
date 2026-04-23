# Wave 4 Step 14 — Integration with handover & defects

## Handover / completion

- **Hard gate:** both manager and stakeholder **create** paths require an existing `project_handover` row with `status` of `handed_over` or `completed`.  
- **Data link:** new requests set `linked_handover_id` to the current project handover id when created.

## Defects (punch list)

- Optional `linked_defect_id` on the service request for **context** (e.g. recurring issue from a prior snag).  
- **Semantic distinction** remains: punch list = pre-completion snags; aftercare = post-handover service — only linked, not merged.

## Discussions

- Optional `linked_discussion_id` for traceability; client detail page links to the portal discussion route when set.

## Timeline

- `project-timeline.repository.ts` adds `service_request_reported` and `service_request_resolved` items (manager operations timeline only — route remains internal workspace).

## Intentionally not changed

- Handover readiness calculators  
- Defects lifecycle rules  
- Stakeholder activity feed (`/stakeholder-activity`) — not extended in this step (timeline integration only).
