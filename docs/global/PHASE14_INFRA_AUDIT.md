# Phase 14 Global Infrastructure Audit

**Phase 14 — Global Infrastructure & Sovereign Clouds (MAX)**  
**Global Infrastructure Architect + Sovereign Cloud Strategist**  
**Current hosting, region/compliance gaps, data flow risks, expansion blockers, priority roadmap.**

---

## Current hosting model

- **Compute:** Next.js on Cloudflare Workers (OpenNext adapter); single deployment per environment (dev, staging, production). No regional replication of app; Workers run at Cloudflare edge (request routed to nearest PoP; backend is single logical deployment).
- **Database:** Supabase (Postgres); URL and keys via env. Single project/region per environment; no multi-region DB or read replicas documented in repo. Migrations in apps/web/supabase/migrations.
- **Storage:** Supabase Storage for media; object path and tenant-scoped buckets/folders. No CDN abstraction or multi-region storage in repo. DATA_AND_MEDIA_SCALING: CDN in front recommended.
- **Auth:** Supabase Auth (JWT, session); no separate identity region. RLS and tenant_members enforce isolation (ENTERPRISE_ZERO_TRUST_PLAN).
- **Outbound:** HTTPS to Supabase, OpenAI/Anthropic/Gemini (AI), Stripe, push (APNs/FCM). No explicit region or residency controls for third-party calls.
- **Secrets:** Cloudflare secrets (dashboard / .dev.vars); no HSM or customer-managed keys in repo.
- **Summary:** Single-region, single-tenant-logical (multi-tenant in one DB/storage). Suitable for global SaaS from one jurisdiction; not yet sovereign-ready or multi-region.

---

## Region gaps

- **No region selection:** Tenant and data are not bound to a region; all tenants share one Supabase project and one Workers deployment. Cannot offer “EU-only” or “India-only” without separate deployments.
- **No regional app deployment:** Single production deployment; no EU worker + US worker with routing by tenant. Edge caching is global but origin (Supabase, AI) is single region.
- **No regional DB/storage:** Supabase project is in one region (set at project creation). No read replicas or regional buckets documented; no “tenant_region” or “data_region” in schema.
- **AI and third-party region:** AI providers (OpenAI, etc.) and Stripe have their own regions; we do not select or document region for those calls. Cross-border transfer may occur.
- **Gap summary:** To be sovereign-ready we need: tenant/org region binding, regional data plane (DB + storage per region or per deployment), and optional regional compute with routing.

---

## Compliance gaps

- **GDPR:** Data in EU: no explicit “EU region” or “processing in EU only”; subprocessors (Supabase, Cloudflare, AI providers) and their regions not documented in one place. DPA and retention exist; residency and transfer mechanisms need to be explicit.
- **Local laws:** PDPL (Middle East), DPDP (India), and other jurisdiction-specific residency or in-country processing not modeled. No tenant-level “jurisdiction” or “restrict_transfer” flag.
- **Government:** No deployment mode for government or air-gapped; no FedRAMP, IL, or national-cloud pattern documented. SOC 2 / ISO roadmap (Phase 13) supports enterprise, not sovereign/government by itself.
- **Certifications:** SOC 2, ISO 27001 roadmap (Phase 13 TRUST_AND_BRAND_STRATEGY); no region-specific certification map (e.g. EU vs US vs India).
- **Gap summary:** Compliance “by design” requires: jurisdiction-aware storage and processing, cross-border transfer logic, tenant region binding, and documentation of subprocessor regions and certifications per region.

---

## Data flow risks

- **Cross-border:** User in EU may hit Workers (global edge) and Supabase (e.g. US region); AI and Stripe may process in US or other regions. Risk: unlawful transfer or lack of adequacy/guarantees.
- **Single point of failure:** One DB and one storage region; outage or block (legal or technical) affects all tenants. No regional failover or data plane separation.
- **Secrets and keys:** Single set of keys per env; compromise or legal seizure in one jurisdiction could affect all data. No regional or customer-managed keys.
- **Backup:** Backup and DR not documented as region-specific; no “backup stays in region” or air-gapped backup pattern. DATA_AND_MEDIA_SCALING mentions cross-region for DR but not sovereign constraints.
- **Mitigation direction:** Regional data planes; tenant region binding; jurisdiction-aware processing and transfer; optional customer-managed keys and regional backups; document and control subprocessor regions.

---

## Expansion blockers

- **Sovereign deals:** Customers requiring “data in country X only” or “no US transfer” cannot be satisfied without regional deployment or dedicated deployment in that jurisdiction.
- **Government and regulated:** Tenders requiring on-prem, private cloud, or air-gapped have no documented deployment mode or security stack (HSM, private networking, air-gapped backup).
- **Global latency and DR:** Single origin; no multi-region failover or active-active. RTO/RPO not formally set; expansion into multiple continents increases latency and single-region risk.
- **Certification per region:** Some customers need region-specific certs or attestations; no mapping of “region X → cert Y” or “deployment mode Z → compliance set W.”
- **Blocker summary:** Until we have regional isolation model, data residency strategy, deployment modes (including dedicated/on-prem), and sovereign security stack, global and sovereign expansion is limited.

---

## Priority roadmap

1. **Data residency and tenant binding (no domain rewrite):** Add optional tenant/org attribute: preferred_region or data_region (e.g. EU, US, IN). Use for routing and documentation only at first; no schema change to core domain entities beyond optional org/tenant metadata. Document subprocessor regions and transfer logic (DATA_RESIDENCY_STRATEGY).
2. **Sovereign architecture design:** Regional isolation model, data plane vs control plane separation, regional encryption and backup, regional CDN routing (SOVEREIGN_CLOUD_ARCHITECTURE). Implement when business requires (e.g. first EU or government deal).
3. **Deployment modes:** Document and support: SaaS multi-tenant (current), dedicated cloud tenant (single-tenant in our cloud, isolated DB/storage), single-tenant deployment (dedicated stack per customer), on-prem enterprise, government private cloud (DEPLOYMENT_MODES). Implementation is incremental; start with “dedicated tenant” as separate Supabase project + optional Workers route.
4. **Sovereign security stack:** Customer-managed keys, HSM usage, zero-trust and private networking, security zoning, air-gapped backups (SOVEREIGN_SECURITY). Required for government and high-assurance; design first, implement for target deployments.
5. **Global reliability:** Multi-region failover, DR, RTO/RPO, geo-replication, latency routing, global load balancing (GLOBAL_RELIABILITY). Supports both resilience and regional routing.
6. **Regional compliance map:** EU (GDPR), Middle East (PDPL), India (DPDP), SOC 2, ISO 27001, government standards (REGIONAL_COMPLIANCE). Per-region and per-deployment-mode mapping; no core domain change.
7. **Execution order:** Residency and binding → deployment modes (SaaS + dedicated) → sovereign architecture for first region → sovereign security for government track → global reliability and full compliance map.

Security-first; compliance by design; support multiple deployment modes; no domain model rewrites.
