# Step 16 — Centralized Observability: Data Hygiene Review

## 1. No raw secrets

- **logger.ts:** REDACT_KEYS (token, password, secret, authorization, cookie, api_key, apikey); sanitize() strips any key whose lowercased name matches or contains "token" or "secret". All logStructured payloads pass through sanitize.
- **Audit details:** AiRuntimeAuditDetails and audit_logs.details do not include prompts, user message content, or API keys. Only request_id, route, latency_ms, output_type, provider, error_kind, etc.
- **Recommendation:** Keep sanitize() as the single path for structured logs; do not log request/response bodies in observability.

## 2. No raw prompts / private AI context

- **AI telemetry and audit:** Only metadata (route, latency, provider, error_kind, retryable). No prompt text, no model output content, no user text in logs or audit.
- **Recommendation:** Continue to exclude any prompt or completion text from logStructured and from audit_logs.details.

## 3. No unnecessary PII

- **Structured logs:** tenant_id, user_id, project_id are UUIDs only. No email, no display name, no IP in standard observability events. request_id/trace_id are UUIDs.
- **Audit:** user_id is UUID; no PII in details.
- **Recommendation:** Do not add email, name, or IP to observability payloads. If needed for security audit, use a separate restricted audit stream.

## 4. No unsafe tenant data exposure

- **Tenant scoping:** Ops and metrics endpoints are tenant-scoped (getTenantContextFromRequest; requireTenant). Admin endpoints require requireAdmin. No cross-tenant data in tenant-facing responses.
- **System route:** /api/system/metrics can optionally filter by x-tenant-id; protected by SYSTEM_API_KEY in production.
- **Recommendation:** Keep admin and system routes behind auth; do not expose other tenants’ metrics or audit to a tenant.

## 5. Admin / ops routes

- **Admin:** requireAdmin(ctx, "read") on admin ops endpoints. Only admins see AI runtime drilldown and full diagnostics.
- **Ops (tenant):** GET /api/v1/ops/metrics and /overview are tenant-scoped; tenant members see only their tenant’s data.
- **Recommendation:** Do not log admin user_id in a way that could be correlated to sensitive actions in public logs; use internal audit if needed.

## 6. Remaining risks

- **Log destination:** Logs go to stdout; the platform (Vercel/CF) may persist them. Ensure platform log retention and access comply with policy; not controlled in repo.
- **Error messages:** captureException logs error.message (truncated to 500 chars). Rarely, message could contain a hint of user input; prefer to keep messages generic in thrown errors where possible.
- **Job last_error:** jobs.last_error may contain exception text from job handlers. Ensure job handlers do not put secrets or PII into thrown messages; document for job authoring.
