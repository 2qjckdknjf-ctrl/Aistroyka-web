# ADR-051: Mobile background upload extensions and push outbox

**Status:** Accepted  
**Decision:** upload_sessions extended with checksum, chunks_expected, chunks_received, background_hint, last_client_ts. device_tokens and push_outbox tables. Push: enqueuePush to outbox; APNs/FCM stubs (send stubbed when credentials absent). Endpoints: POST /api/v1/devices/register, unregister; POST /api/v1/admin/push/test. Docs: MOBILE-BACKGROUND-UPLOADS.md, PUSH-NOTIFICATIONS.md.

**Context:** Phase 6.5; iOS/Android background upload and status updates.

**Consequences:** Clients can register for push; app enqueues messages to outbox; processor job can send when APNs/FCM configured.
