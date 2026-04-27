# Wave 4 Step 19 — Manager / leadership UI (Stage D)

## D1 — Surfaces added

| Surface | Location | Behavior |
|---------|----------|----------|
| **Audit & traceability** block | Project dashboard → **Activity** tab | First block in the tab; lists curated `TraceItem` rows with title, summary, optional note, FK chips, relative time, truncated actor id |

Component: `apps/web/components/projects/ProjectTraceabilityBlock.tsx`.

Data: `GET /api/v1/projects/:id/traceability?limit=60` (React Query key `project-traceability`).

## D2 — Review-friendly design

- Concise list, no full app shell redesign.
- Deep links reuse existing routes (`?tab=…`, daily reports list).
- Truncation message when the read model returns `truncated: true`.

## D3 — Limitations

- **Actor display** shows a short **UUID prefix** only; human-readable names require a future safe resolver (tenant-scoped).
- Stakeholder-only users do not see this block (API 403); Activity tab for internal roles only for this feed.
