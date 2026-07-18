# Task Chat — Device UI Smoke Report

**Date (UTC):** 2026-07-18T22:40Z  
**Operator:** Cursor  
**Candidate media SHA (iOS fixes):** `4667430ac22e305a8d0e1fc9adc7e27266ffc130`  
**Smoke branch tip:** `9ea7a501`  
**Backend live SHA:** `a401693ec6915d9014dc45503a2b1a6ae4412ad8`  
**Device build:** `2026071812` (Debug; not TestFlight)  
**Device:** iPhone 17 Pro / iOS 26.5.2 / team `43A4KW5BKB`

---

## STEP 1 — Device precheck

| Check | Result |
|-------|--------|
| USB `connected` | **NO** — CoreDevice: `available (paired)` |
| Unlocked launch | **NO** — `Locked` on `ai.aistroyka.worker` |
| DDI | **YES** (`ddiServicesAvailable=true` when tunnel works) |
| Developer Mode | **enabled** |
| Candidate SHA present | **YES** (`4667430a` in branch history) |
| Build | **2026071812** |
| Gallery image + short video seeded | **Owner reports YES** — not re-verified under automation (device Locked) |

**STOP:** Physical media matrix not executed this session.

---

## STEP 2 — Backend size_bytes deploy

| Item | Result |
|------|--------|
| Diff review | attachUploadMeta returns `size_bytes`; finalize requires positive size; no authz/tenant change |
| Vitest (43) | PASS |
| `cf:build` | PASS |
| PR | #188 APPROVED + MERGED |
| Staging | `buildStamp.sha7=a401693` — image/voice size_bytes **PASS** |
| Production | `buildStamp.sha7=a401693` — image/voice size_bytes **PASS** |
| Authz | Pavel **403**, cross-tenant **404** |

Video `size_bytes` not yet verifiable — no finalized video message row.

---

## Matrix

| Gate | Verdict |
|------|---------|
| PHOTO_UI | **BLOCKED** (device Locked) |
| VOICE_UI | **BLOCKED** (device Locked) |
| VIDEO_UI | **BLOCKED** (device Locked; asset claimed seeded) |
| OFFLINE_TEXT | **PASS** (prior) |
| OFFLINE_MEDIA_POLICY | **REFUSED_BY_DESIGN** |
| DELETE_UI | **PASS** (prior) |
| AUTHORIZATION_UI | **PASS** (prior + API recheck) |
| CROSS_TENANT_UI | **PASS** (prior + API recheck) |
| PHOTO_SIZE_BYTES | **PASS** (prod list `67`) |
| VOICE_SIZE_BYTES | **PASS** (prod list `512`) |
| VIDEO_SIZE_BYTES | **BLOCKED** (no video row yet) |

---

## TestFlight

**NO** — PHOTO/VOICE/VIDEO UI gates not PASS.

---

## Final table

| Gate | Verdict |
|------|---------|
| USB_DEVICE_CONNECTED | **NO** |
| IOS_DDI_READY | **YES** |
| BACKEND_SIZE_BYTES_DEPLOYED | **YES** |
| STAGING_BUILD_SHA | `a401693` |
| PRODUCTION_BUILD_SHA | `a401693` |
| TASK_CHAT_END_TO_END_READY | **NO** |
| PILOT_DAY0_C3_C12_COMPLETE | **NO** |
| PILOT_DAY0_COMPLETE | **NO** |
