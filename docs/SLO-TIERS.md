# SLO tiers (tenant-tier-aware)

## Overview

- **ENTERPRISE:** Stricter p95 (e.g. 200ms for sync/media), faster job SLA (e.g. 95% within 2 min).
- **PRO:** Standard p95 (500ms), job SLA 95% within 5 min.
- **FREE:** Best-effort; same targets as PRO but lower priority in capacity planning.

## Implementation

- slo_daily stores per tenant and endpoint_group. Evaluation job can compare p95_latency_ms and requests/errors to tier-specific targets (from entitlements or tenant tier).
- Alert when tenant breaches its tier SLO for 2 consecutive windows. ENTERPRISE gets tighter thresholds in alert logic.

## Automation

- SLO evaluation jobs run daily (or per window); write slo_daily; evaluate breach and create alerts. Anomaly detector jobs run on schedule; create anomalies and alerts. Notify via push outbox or admin UI when alert created.
