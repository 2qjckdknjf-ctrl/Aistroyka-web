# ADR-017: Data retention and export jobs

**Status:** Accepted  
**Decision:** data_retention_policies table (per-tenant: media_retention_days, report_retention_days, ai_usage_retention_days). Retention enforcement is scaffolded: document scheduled job strategy; do not implement hard deletes unless safe. Export: POST /api/v1/admin/exports (body: export_type, range_days) enqueues job type "export"; GET /api/v1/admin/exports/:id/status returns job status. Export handler is placeholder (no file generation in Phase 3).

**Context:** Compliance and GDPR-style requests need retention policy definition and export capability; actual deletion and file generation can follow.

**Consequences:** Export job runs in existing job processor; result_url or file delivery is Phase 4.
