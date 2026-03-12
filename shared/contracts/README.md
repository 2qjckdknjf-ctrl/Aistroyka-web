# Shared contracts

Source of truth for API and domain contracts used by mobile (iOS AiStroykaManager, AiStroykaWorker; Android AiStroykaManager, AiStroykaWorker). Align with `packages/contracts` and `docs/API-v1-ENDPOINTS.md`.

- **Auth/session:** JWT, refresh, device registration.
- **Project, task, report:** DTOs and list/detail payloads.
- **AI:** Request/response for image analysis.
- **Notification, role, tenant, sync, upload/media:** See `shared/api` and repo `packages/contracts`.

No shared executable code between iOS and Android here; this folder holds documentation and contract definitions (e.g. JSON Schema or markdown) for codegen or hand-implementation.
