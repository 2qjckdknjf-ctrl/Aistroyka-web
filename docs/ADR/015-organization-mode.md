# ADR-015: B2B organization mode (master account → multiple tenants)

**Status:** Accepted  
**Decision:** Add optional organization layer: organizations, organization_tenants, organization_members (org_owner, org_admin, org_viewer). Org admins can list linked tenants (GET /api/v1/org/tenants) and view aggregated metrics (GET /api/v1/org/metrics/overview?range=30d). Client supplies x-organization-id; auth requires org_owner or org_admin. RLS allows org admins to read tenant_daily_metrics for tenants in their org.

**Context:** Enterprise clients managing multiple tenants need a single view and consolidated metrics without per-tenant login.

**Consequences:** Minimal: no billing implementation; placeholder for consolidated billing. Org membership is separate from tenant membership.
