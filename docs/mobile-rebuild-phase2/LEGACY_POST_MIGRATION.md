# Legacy Cleanup After Migration — Phase 2

**Date:** 2026-03-12

---

## 1. ios/Архив.zip

- **Status:** Migrated source. All relevant code has been copied into ios/Shared, ios/AiStroykaWorker, ios/AiStroykaManager.
- **Retention:** Can remain in `ios/` as a backup, or be moved to `archive/legacy-mobile/` (e.g. `archive/legacy-mobile/ios-archive-20260312.zip`) for clarity. Not deleted in this phase.

---

## 2. Preserved legacy identifiers

| Identifier | Location | Reason |
|------------|----------|--------|
| KeychainHelper keys (com.workerlite.deviceId, sessionToken, sessionUserId, pushToken) | ios/Shared/Sources/Shared/KeychainHelper.swift | Migration continuity; existing installs may have data under these keys. |
| Background URLSession identifier (if still in Worker) | Worker app (BackgroundUploadService or AppDelegate) | Preserved in archive; if present in migrated Worker code, kept to avoid breaking in-flight uploads. |

---

## 3. Removed WorkerLite naming

- **Product/target/scheme:** No "WorkerLite" in the new structure. Final names: AiStroykaWorker, AiStroyka Manager.
- **User-facing strings:** Login and Info.plist use "AiStroyka Worker" / "AiStroyka Manager".
- **Bundle IDs:** New structure uses ai.aistroyka.worker and ai.aistroyka.manager. Legacy POTA.WorkerLite not used in the new projects (documented in phase 1 as optional preserve for existing installs).

---

## 4. What is no longer primary

- Single Xcode project containing both Worker and Manager targets — superseded by two separate projects.
- WorkerLite as the main product name — superseded by AiStroykaWorker.
- Manager as a target inside the Worker project folder — superseded by peer ios/AiStroykaManager/.
