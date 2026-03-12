# Mobile Rebuild — Repository Audit

**Date:** 2026-03-12  
**Role:** Principal Mobile Platform Architect + Repository Refactoring Lead  
**Project:** AISTROYKA

---

## 1. Executive Summary

The repository was audited to support a clean rebuild of mobile into four separate applications: **iOS AiStroykaManager**, **iOS AiStroykaWorker**, **Android AiStroykaManager**, **Android AiStroykaWorker**. Current state: iOS source exists only inside an archive zip; Android is absent; shared contracts live in `packages/contracts`. Legacy naming (WorkerLite) and a single Xcode project containing both Worker and Manager targets are documented in docs and in the archive.

---

## 2. Current Structure

### 2.1 Filesystem (as of audit)

```
AISTROYKA/
├── apps/
│   └── web/                    # Next.js web app (dashboard, API, auth)
├── packages/
│   ├── contracts/              # Shared API contracts (TypeScript schemas)
│   ├── contracts-openapi/      # OpenAPI generation
│   └── api-client/             # API client for web/Node
├── ios/
│   ├── .DS_Store
│   └── Архив.zip               # Archive of previous iOS code (AiStroykaWorker + AiStroykaManager)
├── android/                    # ABSENT
├── shared/                     # ABSENT (no repo-root shared mobile layer)
├── docs/
│   ├── worker-lite/            # Worker Lite status, state map, runbooks
│   ├── ios-manager/            # Manager app design, bootstrap, integration
│   └── ... (ADR, release-audit, etc.)
├── archive/
│   └── legacy-app/            # Archived web/legacy app
└── scripts/, lib/, etc.
```

### 2.2 iOS (from archive and docs)

- **Source of truth for prior structure:** `ios/Архив.zip` and docs (`docs/worker-lite/01_CURRENT_STATE_MAP.md`, `docs/ios-manager/REPORT-IOS-MANAGER-FINAL.md`).
- **Previous layout (inside zip):**
  - One Xcode project: `AiStroykaWorker/AiStroykaWorker.xcodeproj` with **two app targets**:
    - **AiStroykaWorker** (Worker Lite app) — bundle ID `POTA.WorkerLite`
    - **AiStroyka Manager** — bundle ID `ai.aistroyka.manager`
  - Worker app source: `AiStroykaWorker/AiStroykaWorker/` (App, Core, Networking, Services, Persistence, Views).
  - Manager app source: `AiStroykaWorker/AiStroykaManager/` (App, Views, Services, Info.plist, Assets).
  - Shared code: same source files (Core, Networking, AuthService) compiled into both targets via target membership; no separate Shared framework.
- **Alternate project:** Docs mention `WorkerLite/WorkerLite.xcodeproj` as a thin wrapper pointing at the same Worker source; bundle ID inconsistency (e.g. `POTA.AistroykaWorker` typo).

### 2.3 Android

- **No** `android/` directory in the repository.
- No Android app or shared Android code present.

### 2.4 WorkerLite and naming

- **WorkerLite** is the legacy product name; renamed in docs to **AiStroyka Worker** / **AiStroykaWorker** (display and target names).
- Bundle ID and background URLSession id were intentionally kept as `POTA.WorkerLite` and `com.aistroyka.workerlite.uploads` for signing and in-flight uploads.
- Docs still reference "Worker Lite" in titles and API scope (e.g. `docs/API-v1-ENDPOINTS.md`, ADR-005).

### 2.5 Reusable shared logic (backend / contracts)

- **packages/contracts:** TypeScript schemas (health, ai, projects, tenant, subscription, sync, config) and `api/v1` types. Source of truth for API contracts; used by web and can be used for mobile contract docs/codegen.
- **packages/contracts-openapi:** OpenAPI build from contracts.
- **apps/web:** API routes under `/api/v1` (worker, projects, tasks, reports, media, sync, config, auth, etc.). No mobile-specific backend duplication; single API.

### 2.6 Dead or confusing legacy structure

- **WorkerLite as primary product name:** Retired in favor of AiStroykaWorker; bundle IDs and some identifiers kept.
- **Single Xcode project with two app targets:** Manager and Worker in one project; shared code by target membership only. Acceptable for small teams but does not give clear “four separate apps” separation.
- **WorkerLite.xcodeproj (alternate):** Redundant wrapper; causes bundle ID and path confusion.
- **Stale/duplicate folders:** Docs mention `WorkerLite/WorkerLite/` as stale when WorkerLite project pointed at `../AiStroykaWorker/...`.
- **Root-level iOS source:** Previously duplicate Swift at `ios/WorkerLite/` vs `ios/WorkerLite/WorkerLite/`; canonical was under AiStroykaWorker.

---

## 3. Problems in Current Structure

| Problem | Description |
|--------|-------------|
| **No clear four-app layout** | One iOS project with two targets; no Android. Goal is four distinct apps. |
| **WorkerLite naming** | Legacy name still in bundle IDs, URLSession id, and docs; should not be the primary product identity. |
| **Manager hidden inside Worker project** | AiStroyka Manager lives under `ios/AiStroykaWorker/AiStroykaManager/`; not a peer app. |
| **No iOS Shared module** | Shared code is “same files, two targets”; no explicit Shared framework/package. |
| **No Android** | No Android codebase. |
| **No repo-root shared mobile layer** | No `shared/contracts`, `shared/api`, `shared/docs` for cross-platform contracts/docs. |
| **iOS source only in archive** | Current `ios/` has only archive zip; no live Xcode project to open. |

---

## 4. Target Structure

```
ios/
  AiStroykaManager/          # Standalone iOS Manager app (Xcode project)
  AiStroykaWorker/           # Standalone iOS Worker app (Xcode project)
  Shared/                    # Shared iOS code (framework or SPM package)

android/
  AiStroykaManager/          # Manager app module
  AiStroykaWorker/           # Worker app module
  shared/                    # Shared Android library/module

shared/
  contracts/                 # Human- and codegen-friendly API/domain contracts
  api/                       # API endpoint and payload documentation
  docs/                      # Mobile-specific docs (responsibility matrix, etc.)
```

- **Naming:** Final app names **AiStroykaManager** and **AiStroykaWorker** on both platforms.
- **Bundle IDs (recommended):** `ai.aistroyka.manager`, `ai.aistroyka.worker` (iOS and Android). Existing `POTA.WorkerLite` can be preserved for continuity and documented as legacy; new installs can use `ai.aistroyka.worker`.
- **No** WorkerLite as primary product name; no mixing of Manager and Worker in one app.

---

## 5. Migration Plan

1. **Create target directories**  
   Add `ios/AiStroykaManager/`, `ios/AiStroykaWorker/`, `ios/Shared/`, `android/AiStroykaManager/`, `android/AiStroykaWorker/`, `android/shared/`, `shared/contracts/`, `shared/api/`, `shared/docs/`.

2. **iOS**  
   - Create clean Xcode projects: one for AiStroykaManager, one for AiStroykaWorker.  
   - Create or extract `ios/Shared` (Swift package or framework) for Core, Networking, AuthService, DTOs.  
   - Migrate Worker app from archive into `ios/AiStroykaWorker/`; Manager into `ios/AiStroykaManager/`; shared code into `ios/Shared/`.  
   - Use bundle IDs `ai.aistroyka.manager` and `ai.aistroyka.worker` (or keep `POTA.WorkerLite` for Worker and document).  
   - Remove or archive any WorkerLite-named project/target as primary.

3. **Android**  
   - Bootstrap Kotlin/Compose apps for AiStroykaManager and AiStroykaWorker.  
   - Add `android/shared` for shared logic (auth, API client, DTOs).  
   - Align with `shared/` and `packages/contracts` for API contracts.

4. **Shared layer**  
   - Populate `shared/contracts` and `shared/api` from `packages/contracts` and API docs (auth, project, task, report, AI, notification, role, tenant, sync, upload/media).  
   - No requirement for shared executable code between iOS and Android; shared = contracts and docs.

5. **Legacy cleanup**  
   - Do not delete aggressively. Migrate useful code; mark or archive WorkerLite, old target names, and duplicate folders; document what is deprecated.

6. **Reports**  
   - All reports under `docs/mobile-rebuild/` (architecture, responsibility matrix, migration, bootstrap, QA, legacy, final).

---

## 6. What to Migrate vs Deprecate vs Archive

| Item | Action |
|------|--------|
| iOS Worker app logic (auth, API, sync, upload, reports, tasks) | **Migrate** into `ios/AiStroykaWorker/` and `ios/Shared/`. |
| iOS Manager app logic (auth, tabs, projects, placeholder screens) | **Migrate** into `ios/AiStroykaManager/` and `ios/Shared/`. |
| Core, Networking, AuthService, DTOs | **Migrate** into `ios/Shared/`. |
| WorkerLite.xcodeproj / WorkerLite-named targets | **Deprecate/archive**; do not use as primary. |
| Bundle ID POTA.WorkerLite | **Optional preserve** for existing installs; document; new ID `ai.aistroyka.worker` for new installs. |
| packages/contracts | **Reuse** as source of truth; mirror or reference from `shared/contracts` and `shared/api`. |
| Backend domain logic | **No duplication**; keep in apps/web and API only. |
| Android | **Create from scratch**; no existing code to migrate. |

---

## 7. Next Steps

- Implement target folder structure and bootstrap each of the four apps.  
- Create `docs/mobile-rebuild/IOS_REBUILD_ARCHITECTURE.md`, `ANDROID_REBUILD_ARCHITECTURE.md`, `SHARED_DOMAIN_AND_CONTRACTS.md`, `APP_RESPONSIBILITY_MATRIX.md`, `CODE_MIGRATION_REPORT.md`, `BOOTSTRAP_STATUS.md`, `BUILD_AND_STRUCTURE_QA.md`, `LEGACY_CLEANUP_REPORT.md`, and `REPORT-MOBILE-REBUILD-FINAL.md`.
