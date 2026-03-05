# Mobile integration guide

## Overview

- **iOS Full / Android Full:** Full Manager capabilities (projects, AI, jobs, admin). Auth via Supabase; sync and realtime optional.
- **iOS Lite / Android Lite:** Photo-first worker flow: tasks, reports, uploads, offline queue, cursor-based sync. Requires `x-device-id` and `x-idempotency-key` on writes.

## Authentication

- Use Supabase Auth (email/password or OAuth). Store session; send Bearer token in `Authorization` for API calls.
- Token refresh: Supabase client handles refresh; use `getSession()` before each request or attach to client.

## Sync (offline-first)

- **Bootstrap:** `GET /api/v1/sync/bootstrap` with header `x-device-id`. Returns snapshot (tasks, reports, uploadSessions) + `cursor`.
- **Changes:** `GET /api/v1/sync/changes?cursor=<n>&limit=<m>` with `x-device-id`. Returns deltas + `nextCursor`.
- **Ack:** `POST /api/v1/sync/ack` body `{ cursor }` with `x-device-id`. Stores device cursor.
- Always send `x-device-id` on sync endpoints. Use a stable device identifier (e.g. UUID per install).

## Idempotency

- All write endpoints accept `x-idempotency-key`. Use one key per logical operation (e.g. one per "submit report X"). Same key returns same response without re-applying.
- Required for mobile: retries after network failure must use the same key to avoid duplicates.

## Real-time (optional)

- Supabase Realtime: subscribe to Postgres changes on `jobs`, `worker_reports`, `upload_sessions` with filter `tenant_id=eq.<tenantId>`. See docs/REALTIME-STRATEGY.md.
- Use for live job status and report status on Manager or worker dashboards.

## iOS Full

- Auth → Supabase session. API client: baseUrl + getToken from session.
- Projects list/create, AI analyze-image, admin endpoints. Background: optional job polling or realtime.

## iOS Lite

- Auth → session. **Sync:** on launch call bootstrap; then poll changes with cursor; ack after applying. Queue writes offline; on reconnect send with idempotency key.
- **Uploads:** create session → upload to storage path → finalize with `x-idempotency-key`. Report create → add-media → submit (all with idempotency).
- **Conflict:** 409 responses indicate conflict; refresh from sync and retry or merge. See docs/SYNC-CONFLICT-POLICY.md.

## Android

- Same as iOS: Full = Manager flows; Lite = worker + sync + idempotency. Use OpenAPI-generated Kotlin client or hand-wire with same contracts. Same headers: `x-device-id`, `x-idempotency-key`, `Authorization: Bearer <token>`.

## OpenAPI and SDK

- OpenAPI spec: `packages/contracts-openapi/dist/openapi.json`. Includes sync (bootstrap, changes, ack), worker, media, admin.
- TypeScript client: `packages/api-client`. Sync methods require setting `headers['x-device-id']` in options when creating the client or per request.
- iOS: OpenAPI Generator with `swift5`. Android: OpenAPI Generator with `kotlin`. Version policy: v1 stable; breaking changes go to v2.
