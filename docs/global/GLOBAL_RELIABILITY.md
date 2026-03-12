# Global Reliability Fabric

**Phase 14 — Global Infrastructure & Sovereign Clouds**  
**Multi-region failover, disaster recovery, RTO/RPO, geo-replication, latency routing, global load balancing.**

---

## Multi-region failover

- **Concept:** **Failover** from one region to another when primary is unavailable (outage, disaster, or maintenance). For sovereign, failover target must be in same jurisdiction or permitted by contract (e.g. EU primary → EU secondary).
- **Models:** (1) **Active-passive:** Primary region serves traffic; secondary has replica data and is activated on failover (DNS or global LB switch). (2) **Active-active (limited):** Two regions serve read traffic; writes go to primary and replicate; failover = promote secondary to primary. (3) **Per-tenant:** Tenant A in EU primary; Tenant B in US primary; each has own failover target in same jurisdiction.
- **Implementation:** (1) Secondary Supabase project (or equivalent) in same jurisdiction; replication from primary (streaming or batch). (2) Workers or app: health check primary; on failure, switch config or DNS to secondary. (3) Runbooks: who decides failover; how to verify; how to fail back. Document RTO (see below).
- **Value:** Resilience; continuity for sovereign deployments without crossing jurisdiction by accident.

---

## Disaster recovery (DR)

- **Concept:** **DR** = ability to recover after a disaster (region down, data center loss, corruption). Includes backup, replication, and runbooks.
- **Backup:** Full DB and object storage backup; frequency per RPO (e.g. daily or continuous); retention per policy. Backups in same region or paired DR region (sovereign). See DATA_AND_MEDIA_SCALING, SOVEREIGN_CLOUD_ARCHITECTURE.
- **Replication:** For low RPO, use streaming or async replication to secondary region (same jurisdiction for sovereign). For high RPO, backup restore is sufficient.
- **Runbooks:** (1) Detect disaster (monitoring, health). (2) Declare DR; notify. (3) Activate secondary (DB promote, storage switch, DNS/LB). (4) Verify; communicate. (5) Fail back when primary restored. Document and test periodically.
- **Value:** Meets enterprise and regulatory expectations for business continuity.

---

## RTO/RPO targets

- **RTO (Recovery Time Objective):** Max acceptable downtime. Example: 4 hours for standard SaaS; 1 hour for enterprise; 15 minutes for critical. Achieved by failover speed and runbook practice.
- **RPO (Recovery Point Objective):** Max acceptable data loss (time). Example: 24 hours (daily backup); 1 hour (hourly replication); 5 minutes (streaming). Achieved by backup frequency or replication lag.
- **Document:** Publish or contract RTO/RPO per tier or deployment mode. Example: Standard SaaS RTO 4h, RPO 24h; Enterprise RTO 1h, RPO 1h; Government per contract (e.g. RTO 1h, RPO 0 with sync replica).
- **Value:** Clear expectations; drives backup and replication design; supports SLA and compliance.

---

## Geo-replication

- **Concept:** **Replicate** data (DB and/or storage) to one or more regions. For sovereign: replicate only within same jurisdiction or to permitted regions. For global SaaS (non-sovereign): may replicate to second region for DR.
- **DB:** Streaming replication (Postgres) from primary to standby; or async copy. Standby is read-only until failover; can be used for read scaling in same region (read replica) or in DR region.
- **Storage:** Object replication (Supabase or S3 cross-region) to DR bucket in same jurisdiction. Or backup copy to second region.
- **Value:** Enables failover and (optionally) read scaling; must be constrained by residency policy.

---

## Latency routing

- **Concept:** **Route** user or API request to the nearest or lowest-latency app and data. For multi-region SaaS: tenant in EU → EU Workers + EU DB; tenant in US → US Workers + US DB. Reduces latency and improves UX.
- **Implementation:** (1) Tenant has data_region (or infer from billing/contract). (2) Global LB or DNS (e.g. Geo-based) routes to regional endpoint. (3) App in that region talks to same-region DB and storage. (4) No cross-region read/write for that tenant. Combines with sovereign architecture.
- **Value:** Performance for global users; supports “local region” offering without full sovereign for all.

---

## Global load balancing

- **Concept:** **Load balancing** across regions or within region: health checks, traffic to healthy endpoints, failover on failure. Can be DNS-based (e.g. Route 53, Cloudflare LB) or anycast/global LB.
- **Use cases:** (1) **Failover:** Primary down → traffic to secondary. (2) **Latency:** Route to nearest region. (3) **Capacity:** Spread load across multiple regions if active-active. (4) **Sovereign:** Only route to regions allowed for that tenant (e.g. EU tenant → EU only).
- **Implementation:** Cloudflare or provider LB; health check Workers and/or DB connectivity; policy “EU only” or “nearest” per tenant or path. Document in architecture.
- **Value:** Availability and performance; single entry point for global and regional deployments.

---

## Implementation principles

- **No domain model rewrite:** Reliability is infrastructure, replication, and routing; application schema unchanged.
- **Security-first:** Failover and replication respect data residency; no cross-border replication unless permitted.
- **Compliance by design:** RTO/RPO and DR procedures support SOC 2, ISO, and regional requirements (REGIONAL_COMPLIANCE).
- **Support multiple deployment modes:** Single-region SaaS has single-region DR; sovereign has in-jurisdiction failover; dedicated/on-prem has customer-specific DR.
