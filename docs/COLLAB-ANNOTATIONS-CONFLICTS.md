# Collaboration: annotations and comments, conflict resolution

## Model

- **Annotations:** pin, box, polyline, text with coordinates + text. Version field for optimistic concurrency.
- **Comments:** Append-only; body text. No conflict (always add).

## Conflict strategy

- **Annotations:** Client sends If-Match: <version> on PATCH. Server returns 409 with current_version and current_state if version mismatch. Client merges or refreshes and retries.
- **Comments:** No conflict; append-only.

## Sync integration

- Changes to annotations/comments emit change_log (resource_type media, resource_id = mediaId) so offline clients receive deltas via GET /api/v1/sync/changes.

## Endpoints

- POST /api/v1/media/:mediaId/annotations — create.
- PATCH /api/v1/media/:mediaId/annotations/:id — update (If-Match required).
- POST /api/v1/media/:mediaId/comments — create.
- GET /api/v1/media/:mediaId/collab — list annotations + comments.
