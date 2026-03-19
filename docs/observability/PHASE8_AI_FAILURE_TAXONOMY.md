# Phase 8 — AI failure taxonomy (`AIErrorKind`)

| Kind | Use |
|------|-----|
| `auth_failure` | No tenant / session |
| `tenant_failure` | 403 project access |
| `validation_failure` | Bad input, 400 |
| `provider_unavailable` | 502, 503, model down |
| `provider_timeout` | 504, 60s stream abort |
| `rate_limit` | 429, quota / budget 402 |
| `stream_transport_failure` | No response body |
| `stream_parse_failure` | Reserved (malformed SSE chunk — currently silent skip) |
| `fallback_invoked` | Deterministic copilot path (use `fallback_triggered` on GET) |
| `persistence_failure` | DB insert failures (partial — some paths return 503) |
| `output_validation_failure` | Vision policy block (403) |
| `missing_data_degradation` | Reserved for explicit intelligence downgrade code paths |
| `cancellation` | User aborted stream |
| `unknown_internal_error` | Catch-all 500 |

## Wiring

- **Logs:** `ai-telemetry.ts` + route handlers.
- **Audit:** `details.error_kind` on `ai_*_error` actions.
- **Responses:** HTTP status + safe message; no stack traces to client in production.
