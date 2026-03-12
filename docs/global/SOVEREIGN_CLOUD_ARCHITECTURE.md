# Sovereign Cloud Architecture

**Phase 14 — Global Infrastructure & Sovereign Clouds**  
**Regional isolation, data/control plane separation, regional keys, backup, CDN routing.**

---

## Regional isolation model

- **Concept:** **Sovereign-ready** means data and processing for a given jurisdiction or tenant can be confined to a designated region (or deployment). No cross-region data mixing unless explicitly allowed (e.g. replication for DR under same jurisdiction).
- **Models:** (1) **Single global region (current):** One Supabase project, one Workers deployment; all tenants in same data plane. (2) **Regional data planes:** Per region (e.g. EU, US, IN) a separate Supabase project (DB + Storage) and optionally separate Workers deployment or route. Tenant bound to one region; all data for that tenant stays in that region. (3) **Dedicated per tenant/org:** One Supabase project (and optional Workers isolate) per customer; full isolation. (4) **Hybrid:** Default global + “EU tenants” → EU data plane; routing by tenant attribute (e.g. data_region).
- **Binding:** Tenant or org has optional `data_region` or `deployment_region` (e.g. EU, US, IN, GOV). Used by gateway or config to route to correct DB, storage, and (if needed) compute. No change to core domain entities beyond optional metadata on org/tenant.
- **Value:** Satisfies “data in country/region only”; supports GDPR, PDPL, DPDP, and government requirements.

---

## Data plane separation

- **Data plane:** Database, object storage, and (if needed) queue/cache that hold tenant data. For sovereign, **each region has its own data plane**: own Postgres, own buckets, no cross-region replication of tenant data unless same jurisdiction and documented.
- **Separation:** EU data plane: EU Supabase project only; US data plane: US Supabase project only. Application layer (Workers) may be shared or regional: if shared, it must route reads/writes to the correct Supabase URL per tenant’s data_region. If regional Workers, EU Workers → EU Supabase only.
- **Implementation:** (1) Multiple Supabase projects (or equivalent) per region. (2) At request time: resolve tenant → data_region → Supabase URL and storage base; create server client or admin client for that URL. (3) No single “global” DB containing all tenants when sovereign mode is on for that tenant. (4) Migrations: same schema applied to each regional DB; no schema divergence.
- **Value:** Clear boundary; no accidental cross-region data access; compliance and audit.

---

## Control plane separation

- **Control plane:** Auth (if centralized), tenant/org registry, billing, feature flags, API gateway routing, deployment config. May be global (one place) or regional.
- **Option A — Global control plane:** One auth, one tenant list with data_region; one gateway that routes to regional data plane. Pros: single sign-on, single admin; cons: control plane holds tenant→region mapping; if control plane is in one jurisdiction, some customers may require control plane in region too.
- **Option B — Regional control plane:** Per region: auth replica or local IdP, tenant list for that region, regional gateway. Pros: full regional isolation; cons: harder to manage, no global tenant view without federation.
- **Recommendation:** Start with **global control plane** that holds tenant→region and routes to regional data planes; move to regional control plane only when required (e.g. government). Control plane stores no tenant payload data; only identity, routing, and config.
- **Value:** Operational simplicity while allowing data plane sovereignty; path to full regional control when needed.

---

## Regional encryption keys

- **Concept:** Encryption at rest (DB and storage) per region with **region-specific keys**. Prevents one region’s key compromise from exposing another region’s data; supports “keys in region” requirements.
- **Implementation:** (1) Supabase (or provider): use region-specific KMS or key per project; document “EU project uses EU key.” (2) Optional: customer-managed keys (CMK) per tenant or per region — see SOVEREIGN_SECURITY. (3) Key lifecycle: rotate per policy; revocation in one region does not affect others.
- **Value:** Aligns with regulatory expectations (e.g. “encryption keys held in jurisdiction”); limits blast radius of key compromise.

---

## Regional backup model

- **Concept:** Backups for a region stay **in that region** (or in a paired DR region within same jurisdiction). No backup copy to another country unless permitted by contract and law.
- **Implementation:** (1) Supabase (or self-managed): backup target in same region (e.g. EU bucket for EU DB). (2) Optional second copy in same jurisdiction for DR (e.g. second EU zone). (3) Document RPO and retention per region. (4) Air-gapped or offline backup for government mode — see SOVEREIGN_SECURITY.
- **Value:** Compliance with “no cross-border transfer of backup”; supports audit and sovereign tenders.

---

## Regional CDN routing

- **Concept:** Media and static assets for a tenant are served from a **CDN/origin in that tenant’s region** when sovereign is required. Prevents “content in US CDN” for EU tenant.
- **Implementation:** (1) Storage per region (data plane); CDN in front of that region’s storage only, or Cloudflare with “route EU tenant → EU origin.” (2) Worker or gateway: signed URL or redirect to region-specific origin. (3) No global default origin for sovereign tenants; default (non-sovereign) can remain single CDN.
- **Value:** End-to-end regional path for media; latency and compliance.

---

## Implementation principles

- **No domain model rewrite:** Core entities (project, task, report, media) unchanged. Regional binding is org/tenant metadata and routing/config. Same schema in every regional DB.
- **Security-first:** Data plane separation and regional keys limit blast radius; control plane holds minimal data.
- **Compliance by design:** Each region can be mapped to a jurisdiction and certification set (REGIONAL_COMPLIANCE).
- **Support multiple deployment modes:** Sovereign regional model is one mode; SaaS single-region and dedicated tenant are others (DEPLOYMENT_MODES).
