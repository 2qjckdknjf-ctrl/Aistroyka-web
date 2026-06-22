# Mobile API Compatibility Review

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Mobile-Dependent API Surface

|Area|Endpoints|Client users|Current compatibility|
|---|---|---|---|
|Auth/session|Supabase session, Bearer token, `GET /api/v1/me`|Manager, Worker|Compatible, but runtime role fixtures required for review paths.|
|Projects/tasks|`GET /api/v1/projects`, `GET /api/v1/tasks`, `GET /api/v1/worker/tasks/today`, `GET /api/v1/tasks/:id`|Manager, Worker|Compatible; worker/lite allow-list permits project list, worker tasks, task detail.|
|Worker reports|`POST /api/v1/worker/report/create`, `add-media`, `submit`, `GET /api/v1/reports/:id`|Worker|Compatible; iOS/Android omit null `task_id` / `worker_note`; worker own-report read remains allowed.|
|Manager reports|`GET /api/v1/reports`, `GET /api/v1/reports/:id`, `PATCH /api/v1/reports/:id`|Manager|Partially compatible; PR #109 hardening requires explicit server-side project manager role or tenant owner/admin for review.|
|Uploads/media|`POST /api/v1/media/upload-sessions`, `finalize`, Supabase Storage upload|Worker|Compatible by contract; runtime storage and signed/public URL behavior still needs device proof.|
|Sync/offline|`GET /api/v1/sync/bootstrap`, `GET /api/v1/sync/changes`, `POST /api/v1/sync/ack`|Worker|Compatible; runbook documents 409 `server_cursor` and `serverCursor` handling.|
|Devices/push|`POST /api/v1/devices/register`, `unregister`|Manager, Worker|API client support exists; push runtime evidence remains optional/open.|
|Help/activation|`GET /api/v1/activation/status`, `POST /api/v1/help/*`|Manager, Worker|Allowed for lite worker clients and used by iOS/Android helpers.|

## `x-client` Assumptions

Current profiles:

- iOS Worker: `ios_worker`
- iOS Manager: `ios_manager`
- Android Worker: `android_worker`
- Android Manager: `android_manager`

Backend lite allow-list treats `ios_worker` and `android_worker` as field-worker clients. It allows only worker-safe paths plus own report detail, sync, media sessions, devices, auth, activation, and help.

PR #109 report-review hardening is compatible with this model because `PATCH /api/v1/reports/:id` denies lite/worker clients and requires server-side role semantics for non-lite manager clients.

## Breaking-Change Risks After PR #109

Known risk:

- Mobile Manager users with only generic tenant `member` role can no longer review reports unless they also have explicit server-side project manager membership.

This is an intended security hardening, but mobile runtime smoke must use correct role fixtures.

Potential risks:

- Android Manager hardcodes manager profile but must still receive server-side project manager/owner/admin rights.
- Worker own-report detail relies on `report.user_id === ctx.userId`; shared devices or reassigned users need smoke coverage.
- Upload finalize relies on object path prefix and storage credentials; device runtime proof remains required.
- Sync 409 handling is documented and client DTOs include `server_cursor`, but stale local state recovery needs runtime/device verification.

## Compatibility Verdict

API assumptions safe after PR #109: PARTIAL.

Core endpoints remain compatible, but manager review, upload/media, and sync/offline behavior require post-baseline runtime proof with correct role fixtures and isolated pilot data.
