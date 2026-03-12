# Naming and Legacy Cleanup — iOS Launch Validation

**Date:** 2026-03-12  
**Role:** Principal iOS Release Engineer + Mobile Stabilization Lead

---

## 1. User-facing and project names

| Item | Expected | Actual |
|------|----------|--------|
| Worker app display name | AiStroyka Worker | **AiStroyka Worker** (CFBundleDisplayName in Info.plist) |
| Manager app display name | AiStroyka Manager | **AiStroyka Manager** (CFBundleDisplayName) |
| Worker scheme name | AiStroykaWorker | **AiStroykaWorker** |
| Manager scheme name | AiStroykaManager | **AiStroykaManager** |
| Worker project/target | AiStroykaWorker | **AiStroykaWorker** |
| Manager project/target | AiStroykaManager | **AiStroykaManager** |
| Worker bundle ID | ai.aistroyka.worker | **ai.aistroyka.worker** |
| Manager bundle ID | ai.aistroyka.manager | **ai.aistroyka.manager** |

**Conclusion:** User-facing app names, scheme names, and project names are correct. WorkerLite is **not** the primary app name anywhere.

---

## 2. Remaining WorkerLite / workerlite references

These are **internal identifiers only** (not user-facing). Kept for stability (keychain, background sessions, notifications); can be renamed later if desired.

| Location | Reference | Purpose |
|---------|-----------|---------|
| Shared/KeychainHelper.swift | `com.workerlite.deviceId`, `com.workerlite.sessionToken`, `com.workerlite.sessionUserId`, `com.workerlite.pushToken` | Keychain key identifiers. |
| AiStroykaWorker/AppStateStore.swift | `com.workerlite.appstate.store` | DispatchQueue label. |
| AiStroykaWorker/OperationQueueStore.swift | `com.workerlite.ops.persist` | DispatchQueue label. |
| AiStroykaWorker/AiStroykaWorkerAppDelegate.swift | `com.aistroyka.workerlite.uploads` | Background URLSession identifier. |
| AiStroykaWorker/BackgroundUploadService.swift | `com.aistroyka.workerlite.uploads` | Same background session ID. |
| AiStroykaWorker/LocalReminderService.swift | `workerlite.submit`, `workerlite.after` | Notification request identifiers. |

**Recommendation:** Document as legacy identifiers; rename in a later pass to e.g. `ai.aistroyka.worker.*` if keychain/session continuity allows (may require migration for existing installs).

---

## 3. Archive and backup

- No **active** dependency on a "WorkerLite" archive or backup project in the current build.
- The two-app structure (AiStroykaManager, AiStroykaWorker) and Shared are the only active targets; no collapsed or legacy project is in use.

---

## 4. Summary

- **User-facing and project naming:** Correct; AiStroyka Manager / AiStroyka Worker throughout.
- **Deprecated WorkerLite:** Not used as primary name; only internal IDs remain, documented above.
- **Archive:** Backup-only; not an active dependency. Naming and legacy state are **acceptable for launch validation**.
