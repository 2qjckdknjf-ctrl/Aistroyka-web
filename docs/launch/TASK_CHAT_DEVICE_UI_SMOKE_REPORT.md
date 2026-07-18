# Task Chat — Device UI Smoke Report

**Date (UTC):** 2026-07-18T21:00Z  
**Operator:** Cursor (device-smoke worktree)  
**Authoritative source SHA:** `f088ed3418069bac49df8699248252c47ce42e73`  
**Device build:** `2026071807`  
**Install path:** Xcode Debug + UITest runner (not TestFlight)  
**Authz / product scope:** no backend authz changes; synthetic tenant only

---

## STEP 1 — Worktree safety

| Item | Value |
|------|-------|
| pwd | `/Users/alex/Projects/AISTROYKA-task-chat-device-smoke` |
| Branch | `mobile/task-chat-device-smoke-20260718` |
| SHA | `f088ed3418069bac49df8699248252c47ce42e73` |
| `TaskChatView` | **YES** — `ios/Shared/Sources/Shared/TaskChatView.swift` |
| Worker bundle | `ai.aistroyka.worker` |
| Manager bundle | `ai.aistroyka.manager` |
| Signing team | `43A4KW5BKB` |
| Build number | `2026071807` |

### Uncommitted change classification

| Class | Files |
|-------|--------|
| **A** UI-test harness | `WorkerTaskChatUITests.swift`, `.gitignore` (`DeviceSmokeE2ESecrets`) |
| **B** Project wiring | `AiStroykaWorker.xcodeproj/project.pbxproj` |
| **C** Build number | Worker/Manager `Info.plist` → `2026071807` |
| **D** Smoke defect fixes (not redesign) | `TaskChatView.swift` (PhotosPicker `Transferable`, a11y ids, delete affordance, mic permission + denied copy), `NetworkMonitor.swift` (E2E force-offline), locale `task_chat_*` strings |

Secrets (`DeviceSmokeE2ESecrets.swift`, `local-secrets/*`) remain gitignored / uncommitted.

---

## STEP 2 — Device precheck

| Check | Result |
|-------|--------|
| Unlocked / paired | **YES** (after reboot unlock) |
| DDI | **`ddiServicesAvailable=true`** |
| Developer Mode | **enabled** |
| Worker / Manager launch | **YES** (`2026071807`) |
| Camera / Mic / Photos | Prompted during UITests; Limited-Library “Select Photos…” previously poisoned picker automation |
| Storage | 512 GB device — sufficient |
| API | `aistroyka.ai` + staging health `sha7=f088ed3` |
| Synthetic credentials | local gitignored env |
| Obsolete TF `2026063001` | **not used** |

---

## Declared product contracts (media)

| Capability | Contract |
|------------|----------|
| Photo | **Gallery via paperclip → PhotosPicker only.** No in-chat camera capture button. |
| Video | **Gallery/file via same PhotosPicker** (images+videos). No in-chat video camera. |
| Voice | Mic button → record → stop sends; leave chat cancels (`stopRecording(send:false)`). |
| Offline text | Queued via Worker `enqueueOfflineText` / `sendTaskMessage`. |
| Offline media | **Not queued** — shows `task_chat_media_offline`. |

---

## Matrix results

### TEXT_UI — **PASS**

| Step | Result | Evidence |
|------|--------|----------|
| Ivan send + appear | PASS | UITest `testTaskChat_textRoundTripSurface` (earlier full matrix) |
| Persist after restart | PASS | same + API `device-ui-text-*` rows |
| Carlos visibility | PASS (API) | manager list |

### PHOTO_UI — **FAIL**

| Step | Result | Notes |
|------|--------|-------|
| In-chat camera capture | **N/A / FAIL vs matrix** | Not in UI contract — cannot PASS matrix requiring camera |
| Gallery select → send | **FAIL** | UITest `testTaskChat_photoPickerGalleryPath` failed; no UI-originated `kind=image` row |
| Permission controlled error | PARTIAL | Full-access vs Limited Library automation flaky on iOS 26.5.2 |
| `size_bytes` | **DEFECT** | API image from scripted upload has `size_bytes=null` after finalize (P2) |

Backend upload+send for synthetic Ivan **works** (scripted 1×1 PNG → 201). UI path did not complete.

### VOICE_UI — **FAIL**

| Step | Result |
|------|--------|
| Record / cancel / send / playback | **FAIL** — UITest failed; **zero** `kind=voice` server rows from UI |
| Mic denied safe UI | Fix landed (`task_chat_mic_denied`) — denied path not fully proven end-to-end this session |

### VIDEO_UI — **BLOCKED**

| Step | Result |
|------|--------|
| Gallery video | **BLOCKED** — UITest skipped: no selectable video asset on device library |
| Camera video | Not in product contract |

### OFFLINE_SYNC — **BLOCKED**

| Step | Result |
|------|--------|
| Offline text queue → sync exactly once | **PASS** (UI earlier + API: each `device-ui-offline-*` body count = 1; Carlos sees latest) |
| Offline media → sync once | **BLOCKED by product** — media offline intentionally refused (not queued) |
| Matrix rule (text **and** media) | Therefore overall **BLOCKED** |

### DELETE_UI — **PASS**

| Step | Result |
|------|--------|
| Ivan UI delete + gone after relaunch | **PASS** — `testTaskChat_deleteOwnMessageViaUI` |
| Manager / API reflection | PASS for deleted-in-session markers |

### AUTHORIZATION_UI — **PASS**

| Case | Result |
|------|--------|
| Ivan assigned | PASS (UI) |
| Pavel unassigned | PASS (UI) |
| Sofia stakeholder | PASS (UI — no task/chat) |
| Carlos permitted | PASS (API) |
| Cross-tenant smoke user | PASS (UI) — see below |

### CROSS_TENANT_UI — **PASS**

`testTaskChat_crossTenantCannotOpenSyntheticTask` — smoke identity cannot see Pilot task 1 / chat.  
API: smoke `GET …/messages` → **404**; Sofia → **403**.

---

## Defects

| ID | Sev | Summary | Fixed? |
|----|-----|---------|--------|
| D1 | P1 | PhotosPicker gallery send not completing under XCTest / permission flow | No — harness hardened; still FAIL |
| D2 | P1 | Voice UI send produces no server row under XCTest | Partial — mic permission request added |
| D3 | P2 | Message list `size_bytes` null after finalize | No (backend mapping; out of authz scope) |
| D4 | P2 | Offline media not queued | By design — document, not “fixed” |
| D5 | P3 | Relaunch UI find flaky for text/offline after fresh install | No — API confirms delivery |

---

## TestFlight

| Gate | Status |
|------|--------|
| Env `APPROVE_TESTFLIGHT_UPLOAD` | SET locally |
| ASC key path | exists |
| `AISTROYKA_IOS_BUILD_NUMBER` in `.env.local` | still **`2026063001`** (obsolete — must change before upload) |
| Upload this session | **NO** — media matrix not closed; do not ship obsolete build number |

---

## Final verdict table

| Gate | Verdict |
|------|---------|
| TEXT_UI | **PASS** |
| PHOTO_UI | **FAIL** |
| VOICE_UI | **FAIL** |
| VIDEO_UI | **BLOCKED** |
| OFFLINE_SYNC | **BLOCKED** |
| DELETE_UI | **PASS** |
| AUTHORIZATION_UI | **PASS** |
| CROSS_TENANT_UI | **PASS** |
| TASK_CHAT_END_TO_END_READY | **NO** |
| PILOT_DAY0_C3_C12_COMPLETE | **NO** |
| PILOT_DAY0_COMPLETE | **NO** |

Artifacts: `docs/launch/artifacts/task-chat-ui-smoke-2026-07-18/`  
(`final-matrix-summary.json`, redacted `taskchat-*.log`, `installed-apps-final.txt`)
