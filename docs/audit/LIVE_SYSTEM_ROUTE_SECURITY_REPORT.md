# Live System Route Security Report

## Commands Run

- `curl -i "https://aistroyka.ai/api/system/health"`
- `curl -i "https://aistroyka.ai/api/system/health" -H "X-System-Key: WRONG_KEY"`
- `curl -i "https://aistroyka.ai/api/v1/system/health"`
- `curl -i "https://aistroyka.ai/api/v1/system/health" -H "X-System-Key: WRONG_KEY"`
- `curl -i "https://staging.aistroyka.ai/api/system/health"`
- `curl -i "https://staging.aistroyka.ai/api/system/health" -H "X-System-Key: WRONG_KEY"`
- `curl -i "https://staging.aistroyka.ai/api/v1/system/health"`

## Result

- Production no-key `/api/system/health`: HTTP 500, body `Internal Server Error`
- Production wrong-key `/api/system/health`: HTTP 500, body `Internal Server Error`
- Production no-key `/api/v1/system/health`: HTTP 500, body `Internal Server Error`
- Production wrong-key `/api/v1/system/health`: HTTP 500, body `Internal Server Error`
- Staging no-key `/api/system/health`: HTTP 503 with JSON policy block (`system_routes_require_auth`)
- Staging wrong-key `/api/system/health`: HTTP 503 with JSON policy block (`system_routes_require_auth`)
- Staging no-key `/api/v1/system/health`: HTTP 503 with JSON policy block (`system_routes_require_auth`)

## Proof Summary

- Unauthorized production requests did **not** expose real operational/system health payload.
- However, production behavior is currently not policy-clean (returns generic 500 instead of explicit auth error contract).
- Positive auth path verification with valid key is not possible because `SYSTEM_API_KEY` is not available in the session.
- Staging behavior matches expected guard semantics (explicit auth block response).

## Files Changed

- `docs/audit/LIVE_SYSTEM_ROUTE_SECURITY_REPORT.md`

## Blockers

- Missing `SYSTEM_API_KEY` for positive auth pass verification.
- Production runtime currently responds with 500 for unauthorized system-route checks, requiring operator runtime triage/redeploy check.
- Cloudflare prod secret inventory in this session is empty (`wrangler secret list --env production` => `[]`), which increases likelihood of runtime-env misconfiguration.

## Final Verdict

FAIL
