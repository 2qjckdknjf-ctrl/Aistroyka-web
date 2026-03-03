# Admin AI Observability

Enterprise transparency layer for the AI platform: read-only dashboards and request tracing for tenant owners and admins.

## Access

- **Who:** Users with `tenant_members.role` in `('owner', 'admin')` for at least one tenant.
- **Where:** All routes under `/admin/*` are protected by a layout guard. Non-admins are redirected to the dashboard root.
- **RLS:** No cross-tenant data. Edge and client only return data for tenants where the user is owner/admin.

## Pages

| Route | Description |
|-------|-------------|
| `/admin/ai` | Overview: requests today, error rate, p95 latency, breaker state, low-confidence rate, budget exceeded count, top recent issues table. |
| `/admin/ai/security` | Security events table: created_at, severity, event_type, request_id, details (collapsible JSON). Filters: range (24h/7d/30d), severity, event_type. |
| `/admin/ai/requests` | Request ID explorer: input request_id (debounced 300ms), then shows LLM log, retrieval logs, chat messages linked by request_id. |

## Data sources

| UI | Backend | Tables / source |
|----|---------|------------------|
| Overview KPIs (today) | Edge `get_ai_usage_summary` | Aggregates from `ai_llm_logs` (tenant_id, range). |
| Breaker state | Edge `get_ai_breaker_state` | `ai_circuit_breakers` (read via service role after admin check). |
| Recent issues | Edge `list_recent_issues` | `ai_security_events` (user JWT, RLS). |
| Security events | Edge `list_ai_security_events` | `ai_security_events` (user JWT, RLS). |
| SLO daily | Edge `get_ai_slo_daily` | `ai_slo_daily` (service role after admin check). |
| Request by ID | Edge `get_request_by_id` | `ai_llm_logs`, `ai_retrieval_logs`, `ai_chat_messages` (by request_id; service role after admin check). |

## Tables read

- **ai_llm_logs** – mode, total_ms, tokens, fallback_reason, error_category, groundedness_passed, injection_detected, security_blocked, etc. No RLS; accessed via Edge with service role after tenant admin check.
- **ai_security_events** – RLS: project_members or tenant_members. Edge uses user JWT for listing.
- **ai_circuit_breakers** – RLS blocks all user SELECT; Edge uses service role after admin check.
- **ai_slo_daily** – No RLS; Edge filters by tenant_id after admin check.
- **ai_retrieval_logs** – RLS project_members; request lookup via Edge service role after tenant check.
- **ai_chat_messages** – RLS project_members; request lookup via Edge service role after tenant check.

## Debugging an incident by request_id

1. Get **request_id** from:
   - Copilot UI (diagnostics / response header), or
   - Security events table (`/admin/ai/security`), or
   - Overview “Top recent issues” (Request ID column).
2. Open **Request ID explorer** (`/admin/ai/requests`), paste the request_id.
3. Use the result to correlate:
   - **LLM log** – mode, latency, fallback_reason, error_category, groundedness_passed, security flags.
   - **Retrieval logs** – retrieved_count, avg/max similarity, low_confidence.
   - **Chat messages** – last messages with this request_id (role, content, low_confidence).
4. Cross-check with **ai_llm_logs** and **ai_security_events** in DB/runbooks using the same request_id.

## Retention

- Observability data is not deleted by this UI; retention is handled by engine retention/cleanup functions.
- Security events and LLM logs may be pruned by configured retention windows; see engine docs.
