# iOS UITest Smoke Result (2026-06-26)

Base SHA: `2607842599e0149ba60357124e035c8bebcef206`

## Command

```bash
CI_SIGNING_HACK=1 bash ios/scripts/run-ios-uitest-smoke-local.sh
```

**Simulator:** `id=779B2896-9F65-4CD6-93FB-B791DAAE02A8` (iPhone 17 Pro)  
**Signing:** ad-hoc (`CODE_SIGN_IDENTITY=- CODE_SIGNING_REQUIRED=NO`) via `CI_SIGNING_HACK=1` — matches CI `ios-ui-smoke.yml`.

## Tests executed

| App | Test | Result | Duration |
|-----|------|--------|----------|
| Worker | `WorkerSmokeUITests/testLoginScreen_reachableWithPilotIdentifiers` | **passed** | 4.026 s |
| Manager | `ManagerSmokeUITests/testLoginScreen_reachableWithPilotIdentifiers` | **passed** | 3.815 s |

**Overall result:** **PASS** (`OK — Worker and Manager UITest smoke passed.`)

**Log path (local, not committed):** `evidence/ios-simulator-smoke-2026-06-26/logs/ios-uitest-smoke.log`

**Key excerpts:**
```
Test Case '-[AiStroykaWorkerUITests.WorkerSmokeUITests testLoginScreen_reachableWithPilotIdentifiers]' passed (4.026 seconds).
** TEST SUCCEEDED **
Test Case '-[AiStroykaManagerUITests.ManagerSmokeUITests testLoginScreen_reachableWithPilotIdentifiers]' passed (3.815 seconds).
** TEST SUCCEEDED **
OK — Worker and Manager UITest smoke passed.
```

## Scope note
Login-surface smoke only (`pilot_*` identifiers on login screen). Does **not** exercise live backend, report flows, or Layer B E2E (`ios-e2e-integration.yml`).
