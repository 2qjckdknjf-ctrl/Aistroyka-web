# Data and Media Scaling

**Phase 9 — Scale Infrastructure**  
**Storage, retention, and backup at scale.**

---

## Storage tiering strategy

- **Hot:** Active media and reports (recent N days per tenant or per policy). Served from primary storage (e.g. Supabase Storage); fast read/write.
- **Warm:** Older media/reports beyond hot window; same bucket or same region; optional lower-performance tier if provider supports (e.g. Infrequent Access). Access less frequent; cost-optimize.
- **Cold / archive:** Data beyond retention or legal hold; move to cold storage (e.g. S3 Glacier, Supabase cold tier if available) or delete per retention policy. Restore on demand only.
- **Implementation:** Today no tiering in repo; retention is scaffold (DATA-RETENTION-STRATEGY). Define per-tenant or global policy (e.g. hot 90 days, warm 1 year, then delete or archive). Implement via scheduled job that moves or deletes by created_at and policy.

---

## Retention enforcement

- **Policies:** data_retention_policies (media_retention_days, report_retention_days, ai_usage_retention_days) per tenant. Defaults if null (e.g. 365 days).
- **Enforcement job:** Scheduled (cron or job queue) that: (1) reads policies, (2) for each tenant deletes or anonymizes rows where created_at older than retention_days in media, worker_reports, ai_usage, audit_logs. Prefer soft-delete or archive before hard delete; legal hold overrides.
- **Existing:** retention-cleanup job handler exists for tenant-scoped cleanup; ops-events-prune for ops_events. Extend to media and reports per policy; run on schedule.
- **Document:** Retention matrix (table, default days, who can change) in compliance doc.

---

## Media CDN usage

- **Current:** Media URLs from Supabase Storage (getPublicUrl or signed). No CDN in front documented in repo.
- **Recommendation:** Put storage bucket behind CDN (e.g. Cloudflare in front of Supabase, or Supabase CDN if offered) for read-heavy media. Reduces origin load and improves latency for global users.
- **Cache:** Cache media by object path; long TTL (e.g. 1 year) for immutable objects; invalidate on delete/overwrite if needed.
- **Cost:** Egress from origin drops; CDN cost may be lower per GB at scale.

---

## Large upload handling

- **Current:** checkRequestBodySize(request, 1_048_576) — 1 MB max for upload-session create and finalize. Legacy upload route enforces file size (maxUploadBytes).
- **Chunked / resumable:** Not implemented in repo. For very large files (e.g. video), consider chunked upload or resumable URL (e.g. Supabase resumable upload, or multipart). Document max file size per tenant tier if different from 1 MB.
- **Timeouts:** Finalize and storage verification must complete within request timeout (e.g. 30–60s); for large objects, async verification and webhook or poll may be needed. Document limits.
- **Bandwidth:** Monitor egress per tenant or globally; alert on unusual spike.

---

## Backup scale verification

- **Scope:** Full DB (all tables); storage bucket(s) for media. Backup frequency (e.g. daily) and retention (e.g. 30 days) per Supabase or provider.
- **Verification:** Periodically confirm backup completes and size is consistent with growth. Document RPO (e.g. 24h) and backup window.
- **Cross-region:** If required for DR, document replication or backup copy to second region.

---

## Restore drills at volume

- **Drill:** Restore DB (and optionally storage) to staging or isolated env from backup; run smoke tests (auth, sync, report submit, list projects). Record restore duration and success.
- **Frequency:** Quarterly or before major release. At scale, use subset of data (e.g. one tenant) if full restore is too slow.
- **Document:** Restore runbook (steps, who runs, how to verify). Update when backup or restore tooling changes.
