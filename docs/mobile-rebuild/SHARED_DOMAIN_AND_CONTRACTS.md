# Shared Domain and Contracts

**Date:** 2026-03-12  
**Project:** AISTROYKA

---

## 1. Purpose

The **shared** layer at repo root (`shared/contracts`, `shared/api`, `shared/docs`) is the **source of truth for contracts and documentation** used by iOS and Android. It does **not** require shared executable code (e.g. Kotlin Multiplatform); contracts are implemented separately on each platform using these definitions and the existing `packages/contracts` TypeScript schemas.

---

## 2. Layout

```
shared/
  contracts/     # Auth, project, task, report, AI, notification, role, tenant, sync, upload/media
  api/           # Endpoint and payload documentation
  docs/          # Mobile-specific docs (links, responsibility matrix)
```

- **contracts:** Document or mirror DTO and domain shapes (from `packages/contracts` and API docs).
- **api:** Base URL, path list, headers (`x-device-id`, `x-client`), auth (Bearer, Supabase).
- **docs:** Pointers to `docs/mobile-rebuild/` and `docs/API-v1-ENDPOINTS.md`.

---

## 3. Contract areas

| Area            | Description | Source of truth |
|-----------------|-------------|------------------|
| Auth/session    | JWT, refresh, device registration | Supabase Auth; `x-device-id`; `/api/v1/devices` |
| Project         | List/detail, create | `packages/contracts` ProjectSchema, CreateProjectRequestSchema |
| Task            | List, detail, assign, today (worker) | API v1 tasks, worker/tasks/today |
| Report          | Create, add-media, submit, list | API v1 worker/report/*, reports |
| AI              | Analyze image request/response | AnalyzeImageRequestSchema, AnalysisResultSchema |
| Notification    | Push payload, list | API v1 notifications; APNs/FCM |
| Role            | owner, admin, member, viewer | Tenant/me or JWT claims |
| Tenant          | Tenant id, membership | JWT + tenant context |
| Sync            | Bootstrap, changes, ack | SyncBootstrapResponseSchema, SyncChangesResponseSchema, SyncAckRequestSchema |
| Upload/media    | Upload session, finalize | API v1 media/upload-sessions |

---

## 4. API base and headers

- **Base:** `/api/v1` (full URL from config: e.g. `BASE_URL` or `Config.apiBaseURL`).
- **Auth:** `Authorization: Bearer <access_token>`.
- **Headers:** `x-device-id`, `x-client` (`ios_manager`, `ios_lite`, `android_manager`, `android_worker`).
- **Idempotency:** `x-idempotency-key` where required (e.g. worker report submit).

---

## 5. Alignment with repo

- **packages/contracts:** TypeScript Zod schemas; use for codegen or hand port to Swift/Kotlin.
- **docs/API-v1-ENDPOINTS.md:** Authoritative endpoint list and error codes.
- **shared/contracts** and **shared/api:** Human- and codegen-friendly placeholders; keep in sync with packages/contracts and API docs.
