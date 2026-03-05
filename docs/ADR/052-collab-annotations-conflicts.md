# ADR-052: Real-time collaboration (annotations, comments) and conflict resolution

**Status:** Accepted  
**Decision:** Tables photo_annotations (type, data jsonb, version) and photo_comments (body). Annotations: version-based optimistic concurrency; PATCH requires If-Match: version; 409 with current state on mismatch. Comments: append-only. Endpoints: POST/PATCH annotations, POST comments, GET collab. change_log emitted for sync. Docs: COLLAB-ANNOTATIONS-CONFLICTS.md.

**Context:** Phase 6.6; managers annotate photos, workers see feedback; offline-safe.

**Consequences:** Clients must send If-Match for annotation updates; 409 forces refresh and retry or merge.
