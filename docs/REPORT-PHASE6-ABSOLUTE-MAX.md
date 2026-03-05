# Phase 6 — Absolute Maximum: Report

**Project:** AISTROYKA.AI  

---

## 1. Multi-region and tenant sharding

- **Table:** tenant_data_plane (tenant_id, region eu|us|me|apac, shard). Routing: getDataPlane(tenantId) → region, shard, connectionHint. For now connectionHint = "default". Interfaces allow adding another Supabase project later.
- **Docs:** MULTI-REGION-SHARDING-PLAN.md (routing, migration, tenant move, risks). ADR 047.

## 2. Data warehouse export pipeline

- **Tables:** export_batches, export_rows. Sink interface: write(supabase, batchId, rows). Default sink supabase_table; stubs: s3, bigquery, snowflake. Docs: DATA-WAREHOUSE-EXPORTS.md. ADR 048.

## 3. Privacy/PII classification and policy

- **Tables:** privacy_settings (pii_mode, redact_ai_prompts, allow_exports), pii_findings. PII types: EMAIL, PHONE, ADDRESS, PERSON_NAME, ID_NUMBER. Classify at ingestion; block export of high PII when enforce; redact AI prompts when enabled. GET /api/v1/admin/privacy/findings. Docs: PRIVACY-PII-POLICY.md. ADR 049.

## 4. Anomaly detection

- **Tables:** baselines_daily, anomalies. Detectors: ai_cost_spike, login_bruteforce, upload_spike, job_failure_spike, sync_abuse. On anomaly: record + alert + audit. GET /api/v1/admin/anomalies. Docs: ANOMALY-DETECTION.md. ADR 050.

## 5. Mobile background upload and push

- **Upload:** upload_sessions extended with checksum, chunks_expected/chunks_received, background_hint, last_client_ts.
- **Push:** device_tokens, push_outbox. Register/unregister; enqueuePush; APNs/FCM stubs. Docs: MOBILE-BACKGROUND-UPLOADS.md, PUSH-NOTIFICATIONS.md. ADR 051.

## 6. Real-time collaboration

- **Tables:** photo_annotations (version), photo_comments. Annotations: If-Match version; 409 on conflict. Comments: append-only. GET collab; change_log integration. Docs: COLLAB-ANNOTATIONS-CONFLICTS.md. ADR 052.

## 7. Global SLOs and incident playbooks

- **SLO tiers:** ENTERPRISE stricter p95/job SLA; PRO standard; FREE best-effort. Docs: SLO-TIERS.md, INCIDENT-PLAYBOOKS.md (AI outage, Supabase, uploads, job queue, abuse). ADRs 053.

## 8. Security operations

- **Docs:** SECURITY-OPERATIONS.md (secrets rotation, debug allowlist, signed admin scaffold, security events). ADR 054.

## 9. Risk map and Phase 7 roadmap

**Risks:** Multi-region migration complexity; PII false positives; anomaly baseline quality; push delivery dependency on credentials.

**Phase 7 (candidate):** Second data plane live; full SCIM; SAML; materialized analytics; external warehouse loaders; APNs/FCM production implementation.

---

## ADR index (Phase 6)

047 Multi-region sharding hooks  
048 Warehouse export sinks  
049 Privacy PII policy  
050 Anomaly detection  
051 Mobile push outbox  
052 Collab annotations conflicts  
053 SLO tiers playbooks  
054 Security ops rotation  

055 Data plane default only | 056 Export sink default Supabase | 057 PII levels heuristic | 058 Anomaly baselines population | 059 Push send stubbed | 060 Collab If-Match | 061 SLO evaluation jobs | 062 Security events stream | 063 Upload background hint | 064 Device tokens upsert | 065 Photo annotations type/data | 066 Privacy findings admin:read
