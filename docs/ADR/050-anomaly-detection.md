# ADR-050: Anomaly detection (cost, fraud, abuse)

**Status:** Accepted  
**Decision:** Tables baselines_daily (tenant_id, metric, date, value) and anomalies (tenant_id, severity, type, metric, observed, expected, details). Detectors: ai_cost_spike, login_bruteforce, upload_spike, job_failure_spike, sync_abuse. Simple statistical baselines; detectors run as jobs; on anomaly create record + alert + audit. GET /api/v1/admin/anomalies?range=30d. Docs: ANOMALY-DETECTION.md.

**Context:** Phase 6.4; cost/fraud/abuse detection.

**Consequences:** Baselines must be populated by separate job or ingestion; anomalies and alerts feed into incident playbooks.
