# Shared API

API endpoint and payload documentation for mobile clients. Base: `/api/v1`. See repo root `docs/API-v1-ENDPOINTS.md` and `packages/contracts` for authoritative schemas.

- Worker: `/api/v1/worker/tasks/today`, `/api/v1/worker/day/start`, `/api/v1/worker/day/end`, `/api/v1/worker/report/*`, `/api/v1/media/upload-sessions`, `/api/v1/sync/*`, `/api/v1/config`.
- Manager: `/api/v1/projects`, `/api/v1/tasks`, `/api/v1/reports`, `/api/v1/workers`, `/api/v1/ops/overview`, `/api/v1/org/*`.
- Auth: Supabase Auth (REST); Bearer token in `Authorization`; headers `x-device-id`, `x-client` (e.g. `ios_manager`, `ios_lite`, `android_manager`, `android_worker`).
