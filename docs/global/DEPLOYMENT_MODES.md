# Deployment Modes

**Phase 14 — Global Infrastructure & Sovereign Clouds**  
**SaaS multi-tenant, dedicated cloud tenant, single-tenant deployment, on-premise enterprise, government private cloud.**

---

## SaaS multi-tenant (current)

- **Concept:** **Single shared** infrastructure: one (or one per region) Supabase project, one Workers deployment. All tenants share DB, storage, and compute; isolation is logical (tenant_id, RLS, quotas). Current production model.
- **Characteristics:** Lowest cost; single codebase and ops; fast feature rollout. No physical or per-tenant infrastructure.
- **Limitations:** No “data in country X only” unless we add regional data planes and tenant binding (see SOVEREIGN_CLOUD_ARCHITECTURE, DATA_RESIDENCY_STRATEGY). Subprocessors (Supabase, AI, etc.) are shared; region is provider’s default.
- **Evolution:** Add optional data_region per tenant and route to regional data plane when “sovereign SaaS” is required; still multi-tenant per region.
- **Value:** Default for most customers; scale and efficiency.

---

## Dedicated cloud tenant

- **Concept:** **One tenant (org) gets dedicated** DB and storage in our cloud — separate Supabase project (or equivalent); same app code, different config (DB URL, storage). No other tenant’s data in that project. Compute (Workers) may be shared or dedicated (e.g. route by tenant to dedicated Worker or namespace).
- **Characteristics:** Logical and data isolation; same region as our cloud or a region we support (e.g. EU). No on-prem; we operate. Optional: dedicated keys, backup, or replication for that project.
- **Use case:** Enterprise that needs “our data only” but does not need on-prem or government. Often same compliance (SOC 2, ISO) as multi-tenant; different tenancy model.
- **Implementation:** (1) Provision new Supabase project (or equivalent) for that org. (2) Run same migrations. (3) Point org to that project (config or tenant_id → project_id mapping). (4) Billing and ops: track per “dedicated tenant.” (5) No schema change to app; only config and routing.
- **Value:** Strong isolation; meets “dedicated” requirement without full single-tenant or on-prem.

---

## Single-tenant deployment

- **Concept:** **Entire stack** for one customer: dedicated DB, storage, compute (Workers or app servers), and optionally auth. May be in our cloud (dedicated tenant++) or in customer’s cloud (e.g. their AWS/Azure). Same application code; deployment and config are customer-specific.
- **Characteristics:** Full isolation; can place in customer’s VPC or region. We or customer may operate; contract defines who runs what. Optional: customer-managed keys, private link, custom domain.
- **Use case:** Large enterprise or regulated industry that requires “single tenant” by contract; or customer cloud preference (e.g. “only in our Azure”).
- **Implementation:** (1) Deploy app (containers or Workers) and DB/storage in customer’s or our dedicated account/region. (2) CI/CD: same codebase; deploy target and secrets per deployment. (3) No other tenant in that deployment. (4) Updates: we release; customer or we apply per change control.
- **Value:** Maximum isolation and control; supports strict compliance and “your cloud only.”

---

## On-premise enterprise

- **Concept:** **Application and data run in customer’s data center** (or their private cloud). We deliver artifacts (containers, images, or installable); customer runs and operates. No data leaves their perimeter for normal operation; optional: telemetry or support access under contract.
- **Characteristics:** Full control for customer; we do not operate day-to-day. Updates: we provide patches/versions; customer installs. Licensing and support model: subscription or perpetual + support.
- **Use case:** Government, defense, or enterprise that cannot use public cloud or any off-prem.
- **Implementation:** (1) Package: Docker Compose or Kubernetes manifests; DB (Postgres), app, storage (e.g. MinIO or customer storage). (2) Install guide and runbooks. (3) No outbound call to our cloud for core flows (optional: license check or anonymized usage with consent). (4) Support: secure channel (e.g. VPN or ticket) for support access if agreed. (5) Air-gapped option: no internet; updates via secure transfer.
- **Value:** Only option for “no cloud” or “air-gapped” customers; high-touch but high value.

---

## Government private cloud

- **Concept:** **Dedicated environment** for government: may be government’s own cloud (e.g. GovCloud, national cloud) or a dedicated region/partition we operate for government. Requirements: residency, HSM, private networking, zero-trust, air-gapped backup, and often certification (FedRAMP, IL, etc.).
- **Characteristics:** Same as single-tenant or on-prem but with sovereign security stack (SOVEREIGN_SECURITY) and compliance map (REGIONAL_COMPLIANCE). No shared multi-tenant; may be shared among government entities only (community cloud) per contract.
- **Use case:** Public sector, defense, critical infrastructure tenders.
- **Implementation:** (1) Deploy in permitted cloud/region. (2) Apply sovereign security: CMK/HSM, private networking, zoning, air-gapped backup. (3) Certify per framework (roadmap). (4) Operate under government-specific runbooks and change control.
- **Value:** Unlocks government segment; long sales cycle but sticky and high assurance.
- **Note:** Document “government-ready” architecture and roadmap; do not claim certification until achieved.

---

## Comparison (summary)

| Mode              | Isolation     | We operate | Customer operates | Typical use        |
|-------------------|---------------|------------|-------------------|--------------------|
| SaaS multi-tenant  | Logical       | Yes        | No                | Most customers     |
| Dedicated tenant  | Data + logical| Yes        | No                | Enterprise         |
| Single-tenant     | Full stack    | Optional   | Optional          | Enterprise / cloud |
| On-prem           | Full stack    | No         | Yes               | No cloud / air-gap |
| Government cloud  | Full + sovereign | Yes/Optional | Yes/Optional    | Government         |

---

## Implementation principles

- **No domain model rewrite:** Deployment mode is infrastructure and config; same schema and app code across modes. Differences: tenancy count, network, keys, and who operates.
- **Security-first:** Each mode can apply appropriate controls (RLS, CMK, HSM, private net) per SOVEREIGN_SECURITY and REGIONAL_COMPLIANCE.
- **Compliance by design:** Mode selection aligns with residency and certification (e.g. government → sovereign stack and certification roadmap).
- **Support multiple deployment modes:** Product and codebase support all five; which we offer and how we deliver (e.g. on-prem packaging) is phased by demand and ops capacity.
