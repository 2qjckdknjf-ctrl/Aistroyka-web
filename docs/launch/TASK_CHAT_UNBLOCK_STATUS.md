# Task Chat — Unblock Status (Pilot Ops)

**Date (UTC):** 2026-07-18T22:15Z  
**Build worktree:** `/Users/alex/Projects/AISTROYKA-task-chat-device-smoke`  
**Branch:** `mobile/task-chat-device-smoke-20260718`  
**Device build target:** Worker+Manager **`2026071812`** (Xcode Debug; not TestFlight)

---

## Blocker board

| # | Blocker | Status |
|---|---------|--------|
| 1 | Synthetic dataset / credentials | **RESOLVED** |
| 2 | iPhone DDI | **RESOLVED** (when USB connected + unlocked) |
| 3 | Current task_chat device build | **PARTIAL** — `2026071812` builds; physical retest blocked on USB |
| 4 | TEXT / DELETE / AUTHORIZATION / CROSS_TENANT UI | **RESOLVED (PASS)** prior matrix |
| 5 | PHOTO / VOICE UI | **OPEN — FAIL** (awaiting unlocked connected device retest after upload fixes) |
| 6 | VIDEO UI | **OPEN — BLOCKED** (no device video asset; gallery-only contract) |
| 7 | Offline media sync | **N/A — REFUSED_BY_DESIGN** |
| 8 | `size_bytes` list enrichment | **CODE FIXED locally**; **prod still null** until backend deploy |
| 9 | TestFlight task_chat distribution | **OPEN** (do not upload until PHOTO/VOICE/VIDEO + size_bytes PASS) |
| 10 | Pilot Day 0 C3–C12 | **OPEN** |

---

## Root causes (current wave)

1. **`size_bytes` null in list:** `attachUploadMeta` omitted `size_bytes` from `upload_sessions` select/map. Local `:3010` returns 67/512; production `aistroyka.ai` still null until deploy.
2. **Orphan `upload_sessions` (`status=created`):** UI reached create-session then failed upload/finalize; errors were cleared by silent poll (`reload(silent:)` wiped `errorMessage`).
3. **Voice UITest false failure / early stop:** center `app.tap()` could hit Stop immediately; cancel via navigate-away was brittle. Fixed with cancel control + duration fallback.
4. **Storage upload path:** chat helper diverged from proven Worker `UploadManager` (encoding / `upload(for:)`). Aligned to `data(for:)` + raw path.
5. **Device gate:** iPhone currently `available (paired)` not `connected` — cannot claim PHOTO/VOICE PASS.

---

## Verdict snapshot

| Gate | Status |
|------|--------|
| IOS_DDI_READY | **YES** (when connected) |
| CURRENT_DEVICE_BUILD_LAUNCHABLE | **BLOCKED** (USB disconnected) |
| TASK_CHAT_END_TO_END_READY | **NO** |
| PILOT_DAY0_COMPLETE | **NO** |
| TESTFLIGHT | **NO** |

Full matrix: `TASK_CHAT_DEVICE_UI_SMOKE_REPORT.md`.

---

## Next safe actions

1. Reconnect USB + unlock iPhone → re-run fixture photo + voice + gallery photo UITests on `2026071812`.
2. Seed one short gallery video for VIDEO_UI.
3. Merge/deploy backend `size_bytes` list enrichment before claiming prod list PASS.
4. Only then archive/TestFlight with a **new** build number (not `2026071807` / obsolete `2026063001`).
