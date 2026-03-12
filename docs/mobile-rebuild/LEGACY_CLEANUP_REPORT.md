# Legacy Cleanup Report

**Date:** 2026-03-12  
**Project:** AISTROYKA mobile rebuild

---

## 1. Legacy structures identified

| Item | Location / reference | Action |
|------|----------------------|--------|
| WorkerLite (product/target/scheme name) | docs, historical archive | **Deprecated.** Final structure uses only AiStroykaWorker. No WorkerLite-named project or target in new ios/ layout. |
| WorkerLite.xcodeproj (alternate project) | docs/worker-lite/01_CURRENT_STATE_MAP.md | **Archive.** Not recreated in new structure. Single "Worker only" project superseded by ios/AiStroykaWorker. |
| Single Xcode project with two app targets | ios/Архив.zip (AiStroykaWorker.xcodeproj with Worker + Manager) | **Superseded.** New structure: two separate projects. Archive kept for migration reference. |
| Bundle ID POTA.WorkerLite | Previous Worker app | **Optional preserve.** For existing installs and signing continuity, Worker app could keep POTA.WorkerLite; new structure uses ai.aistroyka.worker by default. Document in release notes if both are used. |
| Background URLSession id com.aistroyka.workerlite.uploads | Previous Worker app | **Optional preserve** if migrating existing Worker app in place; otherwise use new identifier with ai.aistroyka.worker. |
| Stale WorkerLite/WorkerLite/ folder | Mentioned in docs (duplicate source) | **Do not recreate.** Only AiStroykaWorker/ and AiStroykaManager/ in new layout. |
| Manager inside Worker project (AiStroykaManager under AiStroykaWorker/) | Archive layout | **Resolved.** Manager is now ios/AiStroykaManager/ as a peer of AiStroykaWorker. |
| docs/worker-lite/, docs/ios-manager/ | Various reports | **Keep.** Historical and reference; no delete. Point from docs/mobile-rebuild to these where relevant. |

---

## 2. What was not deleted

- **ios/Архив.zip:** Kept for migration; contains extractable Worker and Manager code.
- **docs/** (worker-lite, ios-manager, ADR, etc.): Kept; no aggressive doc removal.
- **packages/contracts:** Unchanged; remains source of truth for API contracts.

---

## 3. What is no longer primary

- **WorkerLite** as the main product name for the worker app → **AiStroykaWorker** is primary.
- **One Xcode project with two targets** → **Two separate Xcode projects** are primary.
- **Manager as a target inside Worker project** → **AiStroykaManager** is a standalone project and app.

---

## 4. Summary

Legacy naming and structure are deprecated and documented; new structure is clean and explicit. No aggressive deletion; archive and docs retained for reference and migration. Bundle ID and URLSession id can remain for continuity if needed; otherwise use ai.aistroyka.manager and ai.aistroyka.worker.
