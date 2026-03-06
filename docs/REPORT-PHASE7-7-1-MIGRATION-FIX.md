# Phase 7.7.1 — Migration Timestamps + Pilot Launch Pack

**Date:** 2026-03-06 (Europe/Madrid)  
**Scope:** Normalize migration filenames to current date (rename only); add one-command pilot launch smoke script.

---

## Inventory (Stage 0)

**Migration directory:** `apps/web/supabase/migrations` (only migrations dir in repo).

**Migrations with timestamp > 20260306 (future-dated):**

- **7.7-specific (already on 20260306):** The three Phase 7.7 files were previously renamed and are present as:
  - `20260306130000_reports_task_id.sql`
  - `20260306140000_worker_tasks_extend.sql`
  - `20260306150000_push_outbox_device_id.sql`
- **Remaining future-dated (27 files):** All filenames starting with `20260307`, `20260308`, `20260309`:
  - 20260307000000_sync_engine.sql … 20260307600000_tenant_settings_residency.sql (11)
  - 20260308000000_feature_flags.sql … 20260308500000_experiments.sql (6)
  - 20260309000000_tenant_data_plane.sql … 20260309900000_ops_offline_device_count_rpc.sql (10)

**No filenames starting with 20260310** were found.

---

## Migration renames (old → new)

| Old filename | New filename |
|--------------|--------------|
| *(7.7 three already renamed)* | 20260306130000, 06140000, 06150000 |
| 20260307000000_sync_engine.sql | 20260306400000_sync_engine.sql |
| 20260307100000_realtime_publication.sql | 20260306410000_realtime_publication.sql |
| 20260307200000_tenant_concurrency.sql | 20260306420000_tenant_concurrency.sql |
| 20260307300000_ai_policy_decisions.sql | 20260306430000_ai_policy_decisions.sql |
| 20260307300000_jobs_dedupe_key.sql | 20260306440000_jobs_dedupe_key.sql |
| 20260307400000_ai_policy_decisions.sql | 20260306450000_ai_policy_decisions.sql |
| 20260307400000_slo_alerts.sql | 20260306460000_slo_alerts.sql |
| 20260307500000_retention_archived.sql | 20260306470000_retention_archived.sql |
| 20260307500000_slo_alerts.sql | 20260306480000_slo_alerts.sql |
| 20260307600000_tenant_settings.sql | 20260306490000_tenant_settings.sql |
| 20260307600000_tenant_settings_residency.sql | 20260306500000_tenant_settings_residency.sql |
| 20260308000000_feature_flags.sql | 20260306510000_feature_flags.sql |
| 20260308100000_billing_entitlements.sql | 20260306520000_billing_entitlements.sql |
| 20260308200000_identity_sso.sql | 20260306530000_identity_sso.sql |
| 20260308300000_ai_provider_health.sql | 20260306540000_ai_provider_health.sql |
| 20260308400000_events_analytics.sql | 20260306550000_events_analytics.sql |
| 20260308500000_experiments.sql | 20260306560000_experiments.sql |
| 20260309000000_tenant_data_plane.sql | 20260306570000_tenant_data_plane.sql |
| 20260309100000_export_batches.sql | 20260306580000_export_batches.sql |
| 20260309200000_privacy_pii.sql | 20260306590000_privacy_pii.sql |
| 20260309300000_anomaly_baselines.sql | 20260306600000_anomaly_baselines.sql |
| 20260309400000_upload_push_devices.sql | 20260306610000_upload_push_devices.sql |
| 20260309500000_photo_collab.sql | 20260306620000_photo_collab.sql |
| 20260309550000_push_outbox_drain.sql | 20260306630000_push_outbox_drain.sql |
| 20260309700000_device_tokens_last_seen.sql | 20260306640000_device_tokens_last_seen.sql |
| 20260309800000_ops_events.sql | 20260306650000_ops_events.sql |
| 20260309900000_ops_offline_device_count_rpc.sql | 20260306660000_ops_offline_device_count_rpc.sql |

**Confirmation:** No future-dated migrations remain. All migration filenames use date 20260306 or earlier.

---

## How to run pilot_launch.sh

**Location:** `scripts/smoke/pilot_launch.sh` (repo root).

```bash
BASE_URL=http://localhost:3000 ./scripts/smoke/pilot_launch.sh
CRON_SECRET=xxx BASE_URL=https://staging.example.com ./scripts/smoke/pilot_launch.sh
```

**Expected output (short):**
```
Pilot launch smoke: http://localhost:3000 (from=2026-02-27 to=2026-03-06)
  PASS: cron-tick
  PASS: ops/metrics
  Counters: uploads_stuck=0 uploads_expired=0 devices_offline=0 sync_conflicts=0 tasks_assigned_today=0 tasks_open_today=0 tasks_completed_today=0
  pilot_launch done
```

**Note:** `GET /api/v1/ops/metrics` is tenant-scoped; set `COOKIE` or `AUTH_HEADER` for 200. Script exits non-zero if any HTTP call fails or cron-tick returns `ok:false`.

---

## Rollout order

1. **Backend/web:** Deploy web; run migrations in filename order (all 20260306*).
2. **iOS:** After backend is live.

---

## Rollback note

- Renames only; SQL unchanged. Do not delete applied migrations. If an environment has already applied migrations under the old filenames, re-baseline or mark the new filenames as applied per your migration tooling; do not re-apply the same SQL.
