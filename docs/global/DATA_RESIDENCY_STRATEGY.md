# Data Residency Strategy

**Phase 14 — Global Infrastructure & Sovereign Clouds**  
**Jurisdiction-aware storage, processing locality, cross-border transfer, tenant region binding, legal mapping.**

---

## Jurisdiction-aware storage

- **Concept:** Tenant data (DB rows, object storage) is stored **only in designated jurisdiction(s)**. Designation comes from tenant/org attribute (e.g. data_region = EU) or from contract (e.g. “all data in Germany”).
- **Mapping:** Region id (e.g. EU, US, IN) → physical location (e.g. EU West, US East, Mumbai). Storage provider (Supabase or equivalent) is chosen so that the project’s DB and buckets are in that location. Document “Region EU = provider X, location Y” in compliance and DPA.
- **Enforcement:** At write path: resolve tenant → data_region → correct Supabase (or storage) endpoint; never write to another region’s store for that tenant. At read path: same resolution. App and gateway are the enforcement point when using multiple projects.
- **Value:** Meets “data in country/region” clauses; foundation for GDPR, PDPL, DPDP, and government.

---

## Processing locality

- **Concept:** **Processing** (compute that touches personal or sensitive data) occurs in the same jurisdiction as storage, or in a jurisdiction permitted by law (e.g. adequacy, SCCs). Workers and serverless runs: either run in that region (regional Workers) or ensure no tenant payload is processed in a disallowed jurisdiction (e.g. EU data only through EU Workers or through Workers that do not persist outside EU).
- **Current:** Workers are global edge; request may run in any PoP. For strict sovereignty, “processing” for EU tenant must be limited to EU PoPs or to a dedicated EU deployment. Cloudflare (and similar) may offer “regional only” or “data localization” options; document and enable when required.
- **AI and subprocessors:** AI providers (OpenAI, etc.) may process in US or other regions. For “EU only” tenants: either use an AI provider with EU processing or document transfer (adequacy, SCCs) and get consent. Processing locality strategy must cover AI and other subprocessors — see legal mapping.
- **Value:** Aligns with “processing in jurisdiction” and minimizes unlawful transfer risk.

---

## Cross-border transfer logic

- **Concept:** **Cross-border transfer** is any flow of personal data from one jurisdiction to another. Law (GDPR, PDPL, DPDP, etc.) may restrict or condition such transfer. Strategy: (1) avoid transfer where possible (residency + processing locality); (2) where transfer is needed, use permitted mechanisms (adequacy, SCCs, certification, consent); (3) document and disclose in DPA and privacy notice.
- **Logic in product:** (1) Tenant has data_region (e.g. EU). (2) If feature or subprocessor requires processing outside that region (e.g. AI in US), then: (a) check tenant or org flag (e.g. allow_transfer_for_ai), or (b) block feature for that tenant, or (c) route to in-region provider if available. (3) Log transfer events for audit (optional). No domain model change; config and routing only.
- **Documentation:** Maintain “Subprocessor list” with name, purpose, and region(s); “Transfer map” (from region → to region, mechanism). Update when adding providers or regions.
- **Value:** Legal defensibility; transparency; ability to offer “no transfer” or “transfer only with mechanism” to customers.

---

## Tenant region binding

- **Concept:** **Tenant (or org) is bound to a region** at creation or by admin. Binding determines: which data plane (DB, storage) is used; which CDN/origin; and (if enforced) which compute and subprocessors are allowed.
- **Storage:** Optional column or table: org.data_region or tenant.data_region (e.g. EU, US, IN, GOV). Default null or “default” = current single global region. When set, gateway and app resolve to regional Supabase and storage.
- **Restrictions:** Optional org.allow_cross_border_transfer (boolean) or allow_ai_transfer; when false, block AI or other features that would transfer data, or use only in-region provider. Display in admin UI; document in contract.
- **No domain rewrite:** Projects, tasks, reports, media remain unchanged; only org/tenant metadata and routing logic added.
- **Value:** One place to enforce residency and transfer policy per customer.

---

## Legal mapping

- **Concept:** **Map jurisdictions and regulations** to our regions and features. Used for sales, DPA, and compliance.
- **Table (example):**  
  | Region | Jurisdiction | Primary regulation | Storage location | Transfer allowed |
  |--------|--------------|--------------------|------------------|------------------|
  | EU     | EEA          | GDPR               | EU (e.g. Frankfurt) | Only with adequacy/SCCs |
  | US     | USA          | State/federal      | US East          | Per contract     |
  | IN     | India        | DPDP               | India (e.g. Mumbai) | Per DPDP and contract |
  | ME     | Middle East  | PDPL etc.          | ME region        | Per local law    |
  | GOV    | (varies)     | Government         | Per contract     | No/minimal        |
- **Use:** (1) DPA: “Data stored in region X; processing in Y; transfers as in Subprocessor list.” (2) Sales: “We support EU residency.” (3) Product: data_region options and restrictions follow this map.
- **Ownership:** Legal and compliance own; engineering implements routing and storage per map. Update when new region or law is added.
- **Value:** Single source of truth for “what we support where”; reduces legal and sales friction.

---

## Implementation principles

- **No domain model rewrite:** Residency is binding and routing; core entities unchanged. Same schema in every regional DB.
- **Security-first:** Residency and transfer logic reduce exposure and comply by design.
- **Compliance by design:** Jurisdiction-aware storage and processing are built into deployment and config, not retrofitted.
- **Support multiple deployment modes:** Residency strategy applies to SaaS multi-tenant (with region binding) and to dedicated/single-tenant deployments (entire deployment in one region).
