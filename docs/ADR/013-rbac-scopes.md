# ADR-013: RBAC + resource scopes design

**Status:** Accepted  
**Decision:** Upgrade authorization from simple role-order checks to an enterprise RBAC model with tenant-level roles (OWNER, MANAGER, WORKER, CONTRACTOR), permission verbs (read, write, create, delete, approve, assign, invite, export, billing_admin, ai_admin), and optional resource scopes (tenant:*, project:{id}:*, task:{id}:*, etc.). DB tables: roles, permissions, role_permissions, user_scopes. TenantContext is extended with optional permissionSet and scopes, populated when context is resolved. Existing route-level checks remain backward compatible via sync role-order in tenant.policy.authorize(ctx, action); scope-aware or strict RBAC uses authz.authorize(supabase, ctx, permission, scope).

**Context:** Phase 3 enterprise requirements need project-scoped worker/contractor access, auditability of who can do what, and future ABAC without breaking current behavior.

**Consequences:** Default roles (owner→OWNER, admin→MANAGER, member→WORKER, viewer→CONTRACTOR) map to seeded permission sets. New domain checks (e.g. project membership in Phase 3.2) call authz.service.authorize with scope. No breaking changes to v1 API or existing authorize(ctx, action) call sites.
