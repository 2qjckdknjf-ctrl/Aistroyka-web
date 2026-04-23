# Wave 4 Step 9 — Normalized timeline read model

## Read model

- **Types:** `apps/web/lib/domain/projects/stakeholder-activity-timeline.types.ts`
- **Builder:** `getStakeholderActivityTimeline` in `stakeholder-activity-timeline.repository.ts`
- **Sources:** `listEventsForProject` (client request events) + `project_stakeholders` (manager-only invite/join synthesis).

## Ordering

- All items merged into one list, sorted by `occurredAt` **descending**, then `limit` (default 50, max 100).

## Audience shaping

| Function | Behavior |
|----------|----------|
| `shapeStakeholderAudience` | Drops `visibility === "internal"`, strips `actorId` and `visibility` from JSON. |
| `shapeManagerAudience` | Returns full `StakeholderActivityItem[]` including internal rows and `actorId` for audit. |

## API

- `GET /api/v1/projects/:id/stakeholder-activity?limit=N`
- Internal workspace → `audience: "manager"` + `shapeManagerAudience`
- Else if `canReadClientPortalView` → `audience: "stakeholder"` + `shapeStakeholderAudience`
- Else `403`
