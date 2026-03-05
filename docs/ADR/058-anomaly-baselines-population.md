# ADR-058: Anomaly baselines population

**Status:** Accepted  
**Decision:** baselines_daily populated by separate scheduled job or ingestion (e.g. from slo_daily or events). Detectors read baseline for comparison; if missing, no anomaly raised for that metric/date.
