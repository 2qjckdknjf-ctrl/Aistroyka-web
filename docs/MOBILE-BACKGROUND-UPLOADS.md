# Mobile background uploads

## Upload session extensions

- **checksum:** Optional integrity checksum (e.g. SHA-256) for the final file.
- **chunks_expected / chunks_received:** For chunked uploads; client can report progress.
- **background_hint:** True when client started upload in background (iOS/Android).
- **last_client_ts:** Last timestamp from client for ordering/conflict hints.

## Flow

1. POST /api/v1/media/upload-sessions (existing) with optional body: { background_hint: true, chunks_expected }.
2. Client uploads to storage path; may send chunk progress (chunks_received) via PATCH if we add it, or only at finalize.
3. POST finalize with optional checksum. Server sets status = finalized and emits change_log.

## Offline

- Queue create-session and finalize locally; on reconnect send with x-idempotency-key. Sync engine delivers change_log so other clients see new media.
