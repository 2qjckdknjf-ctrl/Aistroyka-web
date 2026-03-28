# Wave 3 — Submit with proof success (live)

**Date (UTC):** 2026-03-28  
**Base URL:** `https://www.aistroyka.ai`  
**Client:** `x-client: ios_lite` (lite idempotency on all writes)

## Worker identity

- **Type:** Supabase end-user JWT from **password grant** (pilot `SMOKE_*` user from local env).
- **User id (public from API):** `1aabc16d-130a-4e11-8e63-10cc2b34f29d`
- **Tenant id:** `81870b1a-1118-46a4-9c5d-969ccdf47b58`

## Task id

- **None** for this run — `GET /api/v1/worker/tasks/today` returned `{"data":[]}`. Task detail proof was **not** exercised with a real assigned task (no task rows).

## Executed chain (all HTTP 200 unless noted)

1. **`POST /api/v1/worker/report/create`** — draft report created.  
   - **Report id:** `fed6e1da-75a5-4916-90ca-46c6e31a12de`
2. **`POST /api/v1/media/upload-sessions`** — purpose `report_before`.  
   - **Upload session id:** `b9cca319-9485-44b5-b9d2-10fba47b0838`
3. **`POST /api/v1/media/upload-sessions/{id}/finalize`** — body `object_path` = `media/{tenant_id}/{session_id}/proof.jpg`, `mime_type` `image/jpeg`, `size_bytes` 16.  
   - Response: `{"ok":true}`
4. **`POST /api/v1/worker/report/add-media`** — `report_id` + `upload_session_id`.  
   - Response: `{"ok":true}`
5. **`POST /api/v1/worker/report/submit`** — `report_id` only.  
   - Response: **`{"reportId":"fed6e1da-75a5-4916-90ca-46c6e31a12de","jobIds":["c0f3fa56-d2ca-49dc-ad7e-c467a06874a5","8c656cf5-0eda-477d-b3ca-1136f62ebb12"],"status":"queued"}`**

## Proof linkage

- **`worker_report_media` path:** `upload_session_id` = `b9cca319-9485-44b5-b9d2-10fba47b0838` (no `media_id`).

## Post-submit evidence

- **GET `/api/v1/reports/fed6e1da-75a5-4916-90ca-46c6e31a12de`** with same JWT + `x-client: ios_lite` → **`status":"submitted"`**, `media` includes the `upload_session_id` above.

## Verdict

**Submit with proof — live success:** **FULL**
