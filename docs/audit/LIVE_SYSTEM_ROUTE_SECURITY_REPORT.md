# Live System Route Security Report

## Commands Run (2026-05-08 refresh)

- `curl -i "https://staging.aistroyka.ai/api/v1/system/health"`
- `curl -i "https://aistroyka.ai/api/v1/system/health"`
- `curl -i "https://aistroyka.ai/api/system/health"`
- `curl -i "https://staging.aistroyka.ai/api/system/health"`

(Historical 2026-05-01 runs also targeted wrong-key headers; behavior today is consistent on policy, not secret leakage.)

## Result (2026-05-08)

| Endpoint | Environment | Unauthenticated | Body pattern |
|----------|-------------|-----------------|--------------|
| `/api/v1/system/health` | Staging | **503** | JSON: `ServiceUnavailable`, `code: system_routes_require_auth`, message about `SYSTEM_API_KEY` / `X-System-Key` |
| `/api/v1/system/health` | Production | **401** | JSON: `Unauthorized`, `X-System-Key required` |
| `/api/system/health` | Staging | **503** | Same policy family as v1 |
| `/api/system/health` | Production | **401** | JSON: `Unauthorized`, `X-System-Key required` |

## Proof Summary

- Unauthorized responses are **JSON policy errors**, not raw HTML stacks and **not** operational health payloads.
- Production no longer shows the historical **500** generic error on these sampled paths (re-check after each major deploy).

## Positive-key path

- **BLOCKED** in unauthenticated sessions: valid `SYSTEM_API_KEY` + `X-System-Key` not used here — exercise only in a trusted operator shell.

## Files Changed

- `docs/audit/LIVE_SYSTEM_ROUTE_SECURITY_REPORT.md`

## Final Verdict

**PASS** for sampled **unauthenticated** behavior (controlled 401/503, no secret material in body). Positive-key and legacy `/api/system/*` full matrix remain operator-owned.
