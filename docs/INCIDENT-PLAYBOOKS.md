# Incident playbooks

## AI provider outage

1. Check ai_provider_health (circuit breaker state). If open, fallback provider may be in use.
2. If all providers failing: disable AI analysis feature flag for affected tenants or globally; notify.
3. Restore: re-enable when provider status recovers; circuit moves to half_open on next success.

## Supabase degraded

1. Check GET /api/v1/health (db: ok). If 503, check Supabase status page.
2. Reduce write load if possible (pause export jobs, defer non-critical writes).
3. Rollback recent deploy if correlated. Restore when Supabase recovers.

## Upload failures

1. Check upload_sessions status distribution; check storage bucket quota and errors.
2. Verify request size limits and MIME allowlist not blocking valid uploads.
3. Restore: fix config or capacity; retry failed finalizes if idempotent.

## Job queue stuck

1. Check tenant_concurrency (jobs_running at cap?) and jobs table (status = running with old updated_at).
2. Release stuck claims (mark failed or dead) if worker crashed. Restart job processor if needed.
3. Restore: clear stuck jobs; consider increasing concurrency or scaling workers.

## Abuse / cost spike

1. Check GET /api/v1/admin/anomalies; review alerts (slo_breach, quota_spike, job_fail_spike).
2. Apply rate limits or disable feature for offending tenant; revoke tokens if abuse.
3. Restore: re-enable when mitigated; update baselines if new normal.
