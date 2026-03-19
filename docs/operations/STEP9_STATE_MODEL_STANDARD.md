# Step 9 — State model standard

| State | HTTP / UI | Meaning |
|-------|-----------|---------|
| **loading** | Skeleton | Fetch in flight |
| **no data yet** | Empty cards with “add tasks/reports” | Cold project |
| **insufficient_data** | `operational.state`, trust low | Too little activity for strong inference |
| **partial_data** | trust medium | Uneven coverage |
| **low_confidence_health** | trust medium + bullet | Model uncertainty |
| **healthy** | trust high | Good coverage |
| **auth_failure** | 401 + copy | Session |
| **permission_failure** | 403 + copy | RBAC / tenant |
| **route/runtime_failure** | 503 + copy | Server-side intelligence failure |
| **provider_failure** | Vision 502/504 (existing) | Upstream AI |
| **fallback_used** | Copilot GET `fallback_triggered` in telemetry | Deterministic path |

Managers should **not** interpret 503 as “bad project data” for intelligence.
