# iOS Simulator Build Result (2026-06-26)

Base SHA: `2607842599e0149ba60357124e035c8bebcef206`

## Attempt 1 — BLOCKED (missing config)

**Command:** `bash scripts/ios/build-simulator.sh`  
**Result:** **FAIL** (exit 65)  
**Cause:** `Unable to open base configuration reference file '.../ios/Config/Secrets.xcconfig'`  
**Remediation:** Copied `ios/Config/Secrets.xcconfig.example` → `Secrets.xcconfig` (CI pattern; not committed).

## Attempt 2 — PASS

**Command:**
```bash
bash scripts/ios/build-simulator.sh
```

Underlying `xcodebuild` (per scheme, signing disabled):
```bash
xcodebuild -scheme <AiStroykaWorker|AiStroykaManager> \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  build CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO
```

| Scheme | Result |
|--------|--------|
| `AiStroykaWorker` | **BUILD SUCCEEDED** |
| `AiStroykaManager` | **BUILD SUCCEEDED** |

**Overall result:** **PASS** (`=== OK: both simulator builds succeeded ===`)

**Log path (local, not committed):** `evidence/ios-simulator-smoke-2026-06-26/logs/ios-build.log`

**Key excerpt:**
```
** BUILD SUCCEEDED **
=== OK: both simulator builds succeeded ===
```
