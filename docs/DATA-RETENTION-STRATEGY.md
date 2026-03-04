# Data retention strategy (scaffold)

- **data_retention_policies** table stores per-tenant limits: media_retention_days, report_retention_days, ai_usage_retention_days.
- **Enforcement:** Implement a scheduled job (cron or worker) that:
  1. Reads active policies where *_retention_days is not null.
  2. For each tenant, deletes or anonymizes rows in media, worker_reports, ai_usage, audit_logs where `created_at` is older than the configured days.
  3. Prefer soft-delete or move-to-cold storage over hard delete until legal hold and backup procedures are defined.
- **No hard deletes** are implemented in Phase 3; this document defines the intended strategy for Phase 4 or later.
