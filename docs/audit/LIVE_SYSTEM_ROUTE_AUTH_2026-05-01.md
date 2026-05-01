# LIVE System Route Auth Verification (2026-05-01)

## Scope

- Verify runtime protection for `/api/system/health`:
  - no key
  - wrong key
  - correct key (`SYSTEM_API_KEY`)

## Executed checks

1. No key
   - Command:
     - `curl -i https://aistroyka.ai/api/system/health`
   - Result:
     - HTTP `401`
     - Body: `{"error":"Unauthorized","message":"X-System-Key required"}`

2. Wrong key
   - Command:
     - `curl -i https://aistroyka.ai/api/system/health -H "X-System-Key: WRONG_KEY"`
   - Result:
     - HTTP `401`
     - Body: `{"error":"Unauthorized","message":"X-System-Key required"}`

3. Correct key
   - Command attempted conditionally with env key:
     - `curl -i https://aistroyka.ai/api/system/health -H "X-System-Key: $SYSTEM_API_KEY"`
   - Result:
     - **BLOCKED**
     - `SYSTEM_API_KEY` is not set in current environment.

## Findings

- Unauthorized access is correctly rejected without key and with invalid key.
- Positive-path verification (valid key returns real payload) is not executable in this session.

## Blocker

- Missing environment variable: `SYSTEM_API_KEY`.

## Exact operator command

```bash
export SYSTEM_API_KEY="<real_system_api_key>"
curl -i https://aistroyka.ai/api/system/health -H "X-System-Key: $SYSTEM_API_KEY"
```

Expected success criteria:
- HTTP 200 (or documented degraded status) with real system health payload.

## Verdict

- System route auth verification: **PARTIAL / BLOCKED**  
  (negative-path PASS, positive-path BLOCKED).
