# DB migration apply sequence

**Purpose:** Apply Supabase migrations in order for production/staging.  
**Where:** Supabase Dashboard → SQL Editor, or `supabase db push` / your migration runner.

---

## Order (chronological by filename)

Migrations live in `apps/web/supabase/migrations/`. Apply in this order (oldest first):

```
20260303000000_base_tenants_projects.sql
20260304000000_rate_limit_slots.sql
20260304000100_ai_usage_and_billing.sql
20260304000200_tenants_plan.sql
20260304000300_worker_lite.sql
20260304000400_upload_sessions.sql
20260305000000_jobs.sql
20260305000100_idempotency_keys.sql
20260305000200_tenant_daily_metrics.sql
20260306000000_rbac.sql
20260306100000_project_members_task_assignments.sql
20260306130000_reports_task_id.sql
20260306140000_worker_tasks_extend.sql
20260306150000_push_outbox_device_id.sql
20260306200000_organizations.sql
20260306235900_cockpit_indexes.sql
20260306300000_audit_retention.sql
20260306400000_sync_engine.sql
20260306410000_realtime_publication.sql
20260306420000_tenant_concurrency.sql
20260306430000_ai_policy_decisions.sql
20260306440000_jobs_dedupe_key.sql
20260306450000_ai_policy_decisions.sql
20260306460000_slo_alerts.sql
20260306470000_retention_archived.sql
20260306480000_slo_alerts.sql
20260306490000_tenant_settings.sql
20260306500000_tenant_settings_residency.sql
20260306510000_feature_flags.sql
20260306520000_billing_entitlements.sql
20260306530000_identity_sso.sql
20260306540000_ai_provider_health.sql
20260306550000_events_analytics.sql
20260306560000_experiments.sql
20260306570000_tenant_data_plane.sql
20260306580000_export_batches.sql
20260306590000_privacy_pii.sql
20260306600000_anomaly_baselines.sql
20260306610000_upload_push_devices.sql
20260306620000_photo_collab.sql
20260306630000_push_outbox_drain.sql
20260306640000_device_tokens_last_seen.sql
20260306650000_ops_events.sql
20260306660000_ops_offline_device_count_rpc.sql
20260306670000_report_review_manager.sql
20260306680000_manager_notifications.sql
20260306900000_stripe_webhook_idempotency.sql
```

---

## Pilot-critical migration

**20260306900000_stripe_webhook_idempotency.sql** — Creates `processed_stripe_events` for webhook idempotency. If you use Stripe billing, this must be applied before or at pilot; otherwise webhook handler will error on insert.

---

## How to apply

**Option A — Supabase Dashboard**  
1. Open each file in `apps/web/supabase/migrations/` in order.  
2. Copy contents → SQL Editor → Run.  
3. Fix any "already exists" (e.g. table/index) by adjusting or skipping that statement.

**Option B — Supabase CLI**  
From project root (with Supabase linked to your project):

```bash
cd apps/web && npx supabase db push
```

(or your team’s equivalent command).

---

## Verify

After applying, in SQL Editor:

```sql
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'processed_stripe_events');
```

Expected: `true` if 20260306900000 was applied.
