# Compliance readiness (SOC2-lite)

## Data retention and deletion

- Retention policies per tenant (data_retention_policies). Retention job sets archived_at; no hard-delete by default. Deletion on request: process documented; audit log retained.
- Audit logs: retained per policy; export available for compliance.

## Audit log coverage

- User actions: invite, flag_upsert, tenant_flag_set, checkout_session_create, retention_cleanup, export, login (structured log). Resource types and IDs stored; no secrets in logs.

## RBAC model

- Roles: owner, admin, member, viewer. Permissions: read, write, create, delete, approve, assign, invite, export, billing_admin, ai_admin. Role-permission matrix in migrations. Tenant-scoped; project membership for project-level access.

## Incident response outline

- See docs/runbooks/incident-response.md. Steps: detect, contain, remediate, communicate, post-mortem. Alerting via alerts table and admin SLO endpoints.

## Change management (release policy)

- v1 backward compatible (additive only). Breaking changes go to v2. Release runbook: docs/RELEASE-RUNBOOK.md. Staged deploy and smoke matrix.

## Secrets management

- Cloudflare: use Workers Secrets (wrangler secret). Supabase: project settings for anon and service_role keys. No secrets in logs or client responses. DEBUG_* and ALLOW_DEBUG_HOSTS for debug routes; disabled in production.
