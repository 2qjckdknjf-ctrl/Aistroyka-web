# Wave 4 Step 11 — Change orders scope inventory (Stage A)

## A1. Related systems (reuse)

| System | Reuse |
|--------|--------|
| Stakeholder discussions | Optional `linked_discussion_id` |
| Client requests | Optional `linked_request_id` |
| Documents | Optional `linked_document_id` |
| Milestones | Optional `linked_milestone_id` |
| Budget / cost | Impact via levels + summaries + optional numeric deltas (not ERP posting) |
| Portal auth | Same read/manage gates as client portal manager flows |

## A2. Minimal change-order scope

Formal **variation / change order** records that capture:

- What is changing (title, rationale, kind)
- Schedule and budget **impact** (structured levels + optional text + optional numeric hints)
- **Lifecycle status** with manager-controlled transitions
- **Audit trail** of status changes (events table)
- **Linkage** to discussions, documents, requests, milestones when IDs are known

## A3. Kinds (`kind`)

- `owner_variation` — customer-driven change
- `manager_proposed` — team-proposed change
- `document_linked` — tied to a contract/act/document
- `decision_derived` — follows a decision / discussion
- `other` — controlled escape hatch

## A4. Deferred (explicit)

- Legal contract amendment automation, clause-level diff, e-signature
- Procurement, RFQs, vendor awards
- Quantity takeoff, BOQ, enterprise change boards
- Accounting GL export, ERP sync
- Multi-tenant workflow designer
- Notifications fan-out per change (not wired in this step unless trivial; not added)
