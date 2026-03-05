# ADR-053: Global SLO tiers and incident playbooks

**Status:** Accepted  
**Decision:** Tenant-tier-aware SLOs: ENTERPRISE stricter p95 and job SLA; PRO standard; FREE best-effort. Docs: SLO-TIERS.md, INCIDENT-PLAYBOOKS.md (AI outage, Supabase degraded, upload failures, job queue stuck, abuse/cost spike). SLO evaluation and anomaly jobs create alerts; notify via push outbox or admin.

**Context:** Phase 6.7; global reliability.
