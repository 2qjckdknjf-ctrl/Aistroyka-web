# LIVE System Route Auth Verification (2026-05-01)

## Scope

- Verify `/api/system/*` protection behavior for:
  - no key
  - wrong key
  - correct key (`SYSTEM_API_KEY`)
- Endpoints checked:
  - `/api/system/health`
  - `/api/system/metrics`

## Executed checks

1. `/api/system/health` without key
   - `curl -i https://aistroyka.ai/api/system/health`
   - Result:
     - HTTP `401`
     - Body: `{"error":"Unauthorized","message":"X-System-Key required"}`

2. `/api/system/health` with wrong key
   - `curl -i https://aistroyka.ai/api/system/health -H "X-System-Key: WRONG_KEY"`
   - Result:
     - HTTP `401`
     - Body: `{"error":"Unauthorized","message":"X-System-Key required"}`

3. `/api/system/metrics` without key
   - `curl -i https://aistroyka.ai/api/system/metrics`
   - Result:
     - HTTP `401`
     - Body: `{"error":"Unauthorized","message":"X-System-Key required"}`

4. `/api/system/metrics` with wrong key
   - `curl -i https://aistroyka.ai/api/system/metrics -H "X-System-Key: WRONG_KEY"`
   - Result:
     - HTTP `401`
     - Body: `{"error":"Unauthorized","message":"X-System-Key required"}`

5. Positive-path with real key
   - Required command:
     - `curl -i https://aistroyka.ai/api/system/health -H "X-System-Key: $SYSTEM_API_KEY"`
   - Execution status:
     - **BLOCKED**
     - `SYSTEM_API_KEY` is **UNSET** in this session.

## Findings

- Negative-path protection is working: unauthorized requests are denied on `/api/system/health` and `/api/system/metrics`.
- Positive-path runtime verification with real key is not possible without `SYSTEM_API_KEY`.

## External blocker

- Missing secret: `SYSTEM_API_KEY`

## Operator command to close blocker

```bash
export SYSTEM_API_KEY="<real_system_api_key>"
curl -i https://aistroyka.ai/api/system/health -H "X-System-Key: $SYSTEM_API_KEY"
curl -i https://aistroyka.ai/api/system/metrics -H "X-System-Key: $SYSTEM_API_KEY"
```

Expected success criteria:
- no key / wrong key: no real system payload (401/403)
- correct key: real system payload (typically HTTP 200)

## Verdict

- **System route auth: BLOCKED** (negative-path PASS, positive-path not verified)
