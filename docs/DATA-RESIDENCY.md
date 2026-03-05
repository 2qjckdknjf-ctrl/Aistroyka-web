# Data residency (foundation)

Tenant preference is stored in `tenant_settings.data_residency` (e.g. `EU`, `US`, `default`). This is metadata only in Phase 4; no multi-database or region routing is implemented.

## Future split (not implemented)

To support multi-region later:

1. Provision per-region databases or Supabase projects (e.g. EU, US).
2. Route writes/reads by `tenant_settings.data_residency`: use region-specific client for that tenant.
3. Migrate existing tenant data to the chosen region when enabling residency.
4. Keep `tenant_settings` as source of truth for routing and compliance reporting.

Governance and audit can already read `data_residency` for compliance (e.g. "data stored in EU").
