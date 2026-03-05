# Backup and Restore Strategy — Aistroyka AI Platform

**Scope:** Supabase-backed data; Edge code in git.

---

## Supabase backup policy

Backups and PITR are managed by Supabase per plan (e.g. Pro: 7 days PITR). Application-level retention and restore validation are documented here.

---

## Retention of AI and audit logs

- **ai_llm_logs:** Optional purge via run_retention_cleanup (p_llm_logs_days); default conservative (no purge).
- **ai_security_events:** Optional purge via run_retention_cleanup (p_security_events_days).
- **ai_retrieval_logs:** Optional purge via run_retention_cleanup (p_retrieval_logs_days).
- **tenant_request_counters:** cleanup_request_counters(p_keep_minutes), e.g. 120; run via resilience-cron.
- **tenant_request_leases:** cleanup_expired_leases(); run via resilience-cron.
- **ai_slo_daily:** Retain for SLO history (e.g. 12–24 months).

---

## Disaster recovery RTO / RPO targets

- **RPO:** Align with Supabase PITR (e.g. 5–15 min or daily). Acceptable loss for AI logs: last minutes to one day depending on criticality.
- **RTO:** Restore DB and redeploy Edge within same or next business day; set by enterprise (e.g. RPO 24h, RTO 4h staging; RPO 1h, RTO 1h prod).

---

## Restore validation steps

1. After restore: SELECT from ai_llm_logs, ai_security_events with LIMIT 1; verify RLS as tenant user.
2. Redeploy Edge from git; set secrets (OPENAI_API_KEY, CRON_SECRET, ALERT_WEBHOOK_URL, etc.).
3. Smoke: POST Copilot; expect 200 or 429; check X-Request-Id and new ai_llm_logs row.
4. Trigger resilience-cron (cleanup_leases, circuit_watchdog); confirm 200.

---

## Periodic restore test procedure

Frequency: at least annually (recommended quarterly). Steps: (1) Create clone or use backup; (2) Restore to point in time; (3) Run validation steps above; (4) Document result; (5) Update this doc if procedure changes.
