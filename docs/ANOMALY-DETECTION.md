# Anomaly detection

## Overview

- **Baselines:** baselines_daily (tenant_id, metric, date, value). Populated by scheduled or on-demand jobs.
- **Anomalies:** anomalies table (severity, type, metric, observed, expected, details). On detection: insert anomaly + create alert + audit log.

## Detectors

- **ai_cost_spike:** Observed AI cost > baseline * 3 (configurable). Severity critical if > 5x.
- **login_bruteforce:** Login failure count > 20 in window. Triggered from rate-limit or audit aggregation.
- **upload_spike:** Upload count > baseline * 4.
- **job_failure_spike:** Job failure rate > baseline or 50% when total >= 5.
- **sync_abuse:** Sync call count > baseline * 10.

## Execution

- Detectors run as jobs (scheduled or admin-triggered). No long-running process; each run evaluates one tenant/metric/day or window.
- On anomaly: recordAnomaly(), then create alert (alerts table), emit audit.

## Admin

- GET /api/v1/admin/anomalies?range=30d&resolved=false. Permission: admin:read.
