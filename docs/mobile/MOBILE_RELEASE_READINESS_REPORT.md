# Mobile release readiness

**Date:** 2026-05-19  
**Verdict:** **NOT READY**

## iOS

| Item | Status |
|------|--------|
| Bundle IDs | Verify in Xcode (`AiStroykaWorker` / `AiStroykaManager` targets). |
| Debug build | **PASS** (simulator). |
| Release / archive | **Not run** (signing unknown). |
| App icons / launch screen | Present per projects (not re-audited pixel-perfect). |
| Info.plist permission copy | **Verify** before TestFlight. |

## Android

| Item | Status |
|------|--------|
| applicationId | `ai.aistroyka.worker` / manager module equivalent. |
| versionCode / versionName | Worker `1` / `1.0.0` — bump policy TBD. |
| Release signing | **Document only** — no keystore in repo (correct). |
| Play checklist | **Open** |
