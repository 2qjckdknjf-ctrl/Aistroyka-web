# Task Chat — Unblock Status (Pilot Ops)

**Date (UTC):** 2026-07-18T22:40Z  
**Smoke branch:** `mobile/task-chat-device-smoke-20260718` @ `9ea7a501` (tip; candidate media SHA was `4667430a`)  
**Backend merge:** PR **#188** → `a401693ec6915d9014dc45503a2b1a6ae4412ad8`  
**Device build candidate:** Worker+Manager **`2026071812`** (not TestFlight)

---

## Blocker board

| # | Blocker | Status |
|---|---------|--------|
| 1 | Synthetic dataset / credentials | **RESOLVED** |
| 2 | iPhone DDI | **YES** when tunnel works (`ddiServicesAvailable=true`) |
| 3 | USB unlock for UI automation | **OPEN — STOP** — CoreDevice reports `available (paired)` / launch **Locked** |
| 4 | TEXT / DELETE / AUTHORIZATION / CROSS_TENANT UI | **PASS** (prior matrix) |
| 5 | PHOTO / VOICE / VIDEO UI | **OPEN** — physical retest blocked on Locked device |
| 6 | Offline media sync | **N/A — REFUSED_BY_DESIGN** |
| 7 | `size_bytes` list enrichment | **RESOLVED on staging + production** (`a401693`) |
| 8 | TestFlight | **OPEN** — media UI gates not PASS |
| 9 | Pilot Day 0 C3–C12 | **OPEN** |

---

## Backend deploy evidence (size_bytes)

| Item | Value |
|------|-------|
| PR | https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/188 |
| Merged SHA | `a401693ec6915d9014dc45503a2b1a6ae4412ad8` |
| Staging workflow | `29663534583` — success |
| Production workflow | `29663640090` — success |
| Staging `buildStamp.sha7` | `a401693` |
| Production `buildStamp.sha7` | `a401693` |
| Staging list | image `67`, voice `512` |
| Production list | image `67`, voice `512` |
| Pavel (unassigned) | **403** |
| Cross-tenant | **404** |

---

## Device STOP (STEP 1)

At certification attempt time:

- State: **`available (paired)`** (not stably `connected`)
- Launch Worker: **`DeviceLocked`** / SBMainWorkspace denied
- DDI: available when tunnel acquires
- Developer Mode: enabled
- iOS: 26.5.2 / iPhone 17 Pro

Per mission rule: **STOP physical PHOTO/VOICE/VIDEO** until USB-connected + unlocked launch succeeds.

---

## Security note (smoke branch)

Commit `d861452d` accidentally added `docs/launch/pilot-intake.real.local.json`. Tip commit `9ea7a501` **deleted** it and gitignored the path. **Blob may still exist in branch history** — owner should approve history scrub / rotate any sensitive values in that intake if they were real. Do not force-push without explicit owner approval.

---

## Next safe action

1. Owner: wake/unlock iPhone, keep screen on, confirm cable shows CoreDevice **`connected`** (not only paired).  
2. Re-run gallery photo → voice → gallery video on build `2026071812+` against prod `a401693`.  
3. Only then cleanup → reviewed SHA → TestFlight.
