# Compliance and Audit Maturity — Enterprise

**Phase 7 — Enterprise Hardening**

---

## 1. Audit log export strategy

- **Current:**  
  - Audit events are emitted via `emitAudit(supabase, params)` to `audit_logs` (tenant_id, user_id, trace_id, action, resource_type, resource_id, details, created_at). Actions: login, invite, role_change, task_assignment, report_submit, report_review, media_finalize, ai_analysis_complete, export (ADR-016).  
  - **GET /api/v1/admin/audit-logs?range=7d|30d|90d** returns tenant-scoped audit logs for the last N days; requires tenant context and requireAdmin(ctx, "read").  
- **Export strategy:**  
  - **In-app:** Admin panel can show timeline (e.g. governance/AuditTimeline); no bulk export endpoint in repo.  
  - **Recommendations:**  
    - Add a secure export (e.g. GET /api/v1/admin/audit-logs/export?range=30d) that returns CSV or JSON for the tenant, with same admin check and rate limit; log the export action in audit_logs.  
    - For compliance, define retention for audit_logs (see data retention) and document how long exports are available.  
    - Exports should be tenant-scoped only; no cross-tenant export.

---

## 2. Data retention policy

- **Current:**  
  - `docs/DATA-RETENTION-STRATEGY.md`: data_retention_policies table (per-tenant: media_retention_days, report_retention_days, ai_usage_retention_days). Enforcement is intended via scheduled job (soft-delete or cold storage preferred); no hard deletes in production yet.  
  - ADR-017 (retention export), ADR-025 (retention enforcement), ADR-031 (retention safety archive-first) describe approach.  
- **Recommendations:**  
  - Define and document default retention (e.g. 90 days for audit_logs, 365 for reports) and max retention per tier.  
  - Implement or schedule the retention job that respects data_retention_policies and legal hold.  
  - Align retention with any compliance regime (e.g. SOC2, GDPR) and document in a single retention matrix (table, default days, who can change).

---

## 3. Access review process

- **Current:** No automated access review workflow in repo. Tenant members and roles are manageable via invite/accept and tenant settings (owner/admin).  
- **Recommendations:**  
  - Define a periodic access review (e.g. quarterly): list tenant_members and roles per tenant; owner/admin confirms or revokes.  
  - Optional: add an “access review” view in admin that lists members with last_active or last_login (if captured) to support review.  
  - Document the process (who runs it, how often, where results are stored) in this doc or a runbook.

---

## 4. Tenant isolation verification

- **Current:**  
  - All tenant-scoped API routes resolve context via getTenantContextFromRequest (auth + tenant_members); data access is scoped by tenant_id.  
  - RLS on Supabase tables should enforce tenant_id (and optionally auth.uid()) so that even with a misconfigured query, rows from other tenants are not returned.  
  - Service-role client is used only server-side for jobs, push, rate_limit_slots, idempotency; operations are still keyed by tenant_id where applicable.  
- **Verification:**  
  - Review RLS policies on all tables that store tenant data: projects, reports, media, tenant_members, audit_logs, jobs, etc. Ensure no policy allows cross-tenant read/write.  
  - Run tests or manual checks: as user A (tenant 1), attempt to access resource of tenant 2 by ID; expect 404 or 403.  
  - Document the list of tables and isolation mechanism (RLS + app-layer tenant_id) in SECURITY_HARDENING or here.

---

## 5. PII handling review

- **Current:**  
  - **PRIVACY-PII-POLICY.md:** PII types (EMAIL, PHONE, ADDRESS, PERSON_NAME, ID_NUMBER); levels (none, low, medium, high). Tenant privacy_settings: pii_mode (off | detect | enforce), redact_ai_prompts, allow_exports.  
  - **Enforcement:** Export of high PII blocked unless tenant allows (privacy.policy canExportWithPii). AI prompts redacted when redact_ai_prompts is true (redaction.service). Policy service blocks AI analysis when pii_mode strict and image host untrusted.  
  - **Findings:** pii_findings table stores classifications; GET /api/v1/admin/privacy/findings lists them (admin only).  
  - **Structured logs:** Logger redacts token/secret/password; no PII in event payloads (observability/logger, event.schema).  
- **Recommendations:**  
  - Ensure audit_logs.details and any export do not include raw PII (e.g. mask email in exports).  
  - Document where PII can appear (e.g. report body, media, comments) and how it is protected (RLS, redaction, access control).  
  - Align pii_mode and allow_exports with enterprise contracts and document defaults.

---

## Control summary

| Control | Status | Notes |
|---------|--------|--------|
| Audit log export | Partial | In-app list; add secure bulk export and document |
| Data retention policy | Documented | Strategy and ADRs; enforcement job to be implemented/scheduled |
| Access review process | Recommended | Define periodicity and optional admin view |
| Tenant isolation | Implemented | Verify RLS and document table list |
| PII handling | Implemented | Policy, classifier, redaction, findings; document PII locations |
