# Task Chat — Device UI Smoke Report

**Date (UTC):** 2026-07-18T22:15Z  
**Operator:** Cursor (device-smoke worktree)  
**Base task_chat SHA:** `f088ed3418069bac49df8699248252c47ce42e73`  
**Branch HEAD at report:** uncommitted wave → build **`2026071812`**  
**Install path:** Xcode Debug + UITest runner (not TestFlight)  
**Authz / product scope:** no backend authz changes; synthetic tenant only

---

## STEP 1 — Reconcile

| Item | Value |
|------|-------|
| pwd | `/Users/alex/Projects/AISTROYKA-task-chat-device-smoke` |
| Branch | `mobile/task-chat-device-smoke-20260718` |
| Prior pushed HEAD | `1d0489c987c48c899a7abb38d44e42db5d87937b` |
| Commits on top of `f088ed3` (pushed) | `b236b707` fix · `a9569eaf` test · `1d0489c9` docs |
| Worker / Manager bundle | `ai.aistroyka.worker` / `ai.aistroyka.manager` |
| Signing team | `43A4KW5BKB` |
| Build number | **`2026071812`** (do not reuse `2026071807`) |

### File classification (current wave)

| Class | Files |
|-------|--------|
| **A Production fix** | `task-messages.repository.ts` (`size_bytes` in attach meta), `upload-session.service.ts` (positive `size_bytes` for task_chat finalize), `MediaUploadHelper.swift`, `TaskChatView.swift` (mic/recorder/cancel/errors), `TaskMessageDTO.swift`, `ChatMediaPrep.swift`, `APIClient.swift` (snake_case encode), locale strings, Info.plist build |
| **B Regression test** | `upload-session.service.test.ts`, `task-messages.attach-meta.test.ts`, `WorkerTaskChatUITests.swift` (fixture photo + voice cancel) |
| **C Device-smoke harness only** | `ChatMediaE2E.swift` (flag `AISTROYKA_E2E_CHAT_FIXTURE=1` only), `NetworkMonitor` force-offline (prior), gitignored `DeviceSmokeE2ESecrets.swift` |
| **D Documentation** | this report + unblock / Day0 docs |
| **E Temporary/unacceptable** | **None** — fixture path is launch-flag gated; secrets gitignored |

No debug credentials/endpoints in app runtime without E2E flags. `DeviceSmokeE2ESecrets.swift` remains gitignored.

---

## Product contracts

| Capability | Contract |
|------------|----------|
| Photo | Gallery via paperclip → PhotosPicker only. No in-chat camera. |
| Video | Gallery via same PhotosPicker. No in-chat recording. |
| Voice | In-app mic record → stop sends; cancel control discards. |
| Offline text | Supported (exactly-once). |
| Offline media | **REFUSED_BY_DESIGN** — `task_chat_media_offline` |

---

## Matrix results

| Gate | Verdict | Notes |
|------|---------|-------|
| TEXT_UI | **PASS** | Prior physical/UITest matrix |
| PHOTO_UI | **FAIL** | Gallery XCTest still open; fixture path not re-proven (device locked/disconnected). Backend scripted image OK. |
| VOICE_UI | **FAIL** | Last UITest failed; orphan `upload_sessions` at create; fixes landed, retest blocked on USB |
| VIDEO_UI | **BLOCKED** | No short video asset on device library |
| OFFLINE_TEXT | **PASS** | Prior |
| OFFLINE_MEDIA_POLICY | **REFUSED_BY_DESIGN** | Not a defect |
| DELETE_UI | **PASS** | Prior |
| AUTHORIZATION_UI | **PASS** | Prior |
| CROSS_TENANT_UI | **PASS** | Prior |
| PHOTO_SIZE_BYTES | **FAIL (prod)** / **PASS (local :3010)** | Local list returns 67; prod still `null` until deploy |
| VOICE_SIZE_BYTES | **FAIL (prod)** / **PASS (local :3010)** | Local list returns 512; prod still `null` until deploy |
| VIDEO_SIZE_BYTES | **BLOCKED** | No finalized video row yet |

---

## Root causes + fixes (this wave)

| Defect | Root cause | Fix |
|--------|------------|-----|
| List `size_bytes` null | `attachUploadMeta` selected only `id, mime_type, object_path` | Select/map `size_bytes`; require positive size on task_chat finalize |
| Media UI orphans | Upload helper ≠ report UploadManager; silent poll cleared errors | Align storage POST; keep errors across silent reload |
| Voice XCTest | Center tap hit Stop; cancel via nav; `currentTime` stale | Cancel button; duration via `AVAudioPlayer`; `prepareToRecord` |
| Photo XCTest brittleness | System PhotosPicker / Limited Library | E2E fixture JPEG behind flag (upload-path regression); gallery still required for PHOTO_UI PASS |

---

## Device gate (blocking retest)

| Check | Result |
|-------|--------|
| iPhone 17 Pro / iOS 26.5.2 | Paired |
| USB CoreDevice state | **`available (paired)` — not `connected`** |
| Unlock / launch Worker | **Blocked** (`Locked` / disconnect) |
| DDI when connected | Available previously |

---

## TestFlight

| Gate | Status |
|------|--------|
| Upload this session | **NO** |
| Reason | PHOTO/VOICE/VIDEO not PASS; prod `size_bytes` not PASS; device disconnected |

---

## Final verdict table

| Gate | Verdict |
|------|---------|
| PHOTO_UI | **FAIL** |
| VOICE_UI | **FAIL** |
| VIDEO_UI | **BLOCKED** |
| OFFLINE_TEXT | **PASS** |
| OFFLINE_MEDIA_POLICY | **REFUSED_BY_DESIGN** |
| DELETE_UI | **PASS** |
| AUTHORIZATION_UI | **PASS** |
| CROSS_TENANT_UI | **PASS** |
| PHOTO_SIZE_BYTES | **FAIL** (prod) |
| VOICE_SIZE_BYTES | **FAIL** (prod) |
| VIDEO_SIZE_BYTES | **BLOCKED** |
| FINAL_SOURCE_SHA | _(pending reviewed commit after device PASS)_ |
| FINAL_BUILD_NUMBER | **2026071812** (candidate; not TF) |
| TESTFLIGHT_UPLOADED | **NO** |
| TESTFLIGHT_PROCESSED | **NO** |
| TESTFLIGHT_INSTALLED | **NO** |
| TESTFLIGHT_MEDIA_SMOKE | **BLOCKED** |
| TASK_CHAT_END_TO_END_READY | **NO** |
| PILOT_DAY0_C3_C12_COMPLETE | **NO** |
| PILOT_DAY0_COMPLETE | **NO** |

Artifacts: `docs/launch/artifacts/task-chat-ui-smoke-2026-07-18/` (gitignored locally)
