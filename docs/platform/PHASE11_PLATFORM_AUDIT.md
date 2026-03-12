# Phase 11 Platform Audit — Ecosystem & Platformization

**Date:** 2026-03-10  
**Role:** Principal Platform Architect + Ecosystem Strategy Lead  
**Purpose:** Assess current extensibility and integration posture before ecosystem build-out.

---

## Current extensibility posture

- **Product model:** Single-tenant SaaS with tenant-scoped data (projects, tasks, reports, media, jobs). No plug-in or extension runtime in app; extensibility is via API and events.
- **API surface:** REST over `/api/v1` with JWT + tenant context; documented in API-v1-ENDPOINTS and contracts package. No public/partner API gateway or API keys; same auth as product UI.
- **Data model:** Domain entities (project, task, report, media, upload_session, job) are stable; no generic “integration payload” or webhook registry in core. Audit logs and sync change log exist; no outbound event bus.
- **Storage:** Supabase (DB + Storage); no abstraction layer for pluggable storage. Media path and object_path are tenant-scoped.
- **Assessment:** Suitable for first-party clients (web, iOS, Android); not yet structured as a platform with public API, webhooks, and third-party integrations. Extensibility = add routes and contracts without changing domain logic.

---

## Existing integration points

| Point | Type | Auth | Use |
|-------|------|------|-----|
| **REST /api/v1/** | Inbound | JWT + tenant | Web, iOS, Android clients; all tenant-scoped. |
| **Supabase RLS + service role** | Inbound (server) | Service role for jobs, push, rate limit | Internal only; no external caller. |
| **Stripe** | Outbound | Webhook secret | Billing (checkout, portal, webhook). |
| **Push (APNs, FCM)** | Outbound | Provider credentials | Notifications. |
| **AI providers (OpenAI, etc.)** | Outbound | API keys | Image analysis. |
| **Contracts package** | Schema | N/A | OpenAPI/validation for v1. |

**No:** Outbound webhooks to customer systems; public API keys; ERP/BIM/document connectors; government or e-sign integrations.

---

## API readiness

- **Readiness for first-party:** High. Stable routes, tenant context, rate limits, request_id, contracts. Mobile and web consume same API.
- **Readiness for third-party:** Partial. Same API can be used by partners with JWT (user or service account); no dedicated “API key” or “app” model; no public docs portal or sandbox. Rate limits and quotas are per-tenant; no per-app or per-key limits.
- **Gaps for platform:** API gateway (or proxy) for public/partner traffic; API key or OAuth client credentials; separate rate limits and SLAs for partners; versioning policy (e.g. /v1, /v2) and deprecation; sandbox environment and test data.

---

## Data interchange formats

- **Request/response:** JSON. Content-Type application/json. Snake_case in API (per contracts).
- **Sync:** Cursor-based sync (bootstrap, changes, ack); conflict handling and retention window. Proprietary; no industry-standard sync protocol.
- **Export:** Audit log list (admin); report/project data via app or future export API. No standard format (e.g. UBL, COBie) for construction.
- **Media:** Upload via presigned or server-handled path; object_path and mime_type; no IFC or BIM format in pipeline.
- **Gaps:** No canonical mapping to ERP formats (invoices, cost codes); no IFC or drawing version payload; no e-sign or document lifecycle format. Define in ERP_INTEGRATIONS, BIM_INTEGRATIONS, DOCUMENT_AND_ESIGN.

---

## Ecosystem gaps

1. **ERP:** No finance/project budget/cost/invoice sync; no connector to 1C, SAP, NetSuite, Odoo.
2. **BIM/design:** No linkage of tasks or reports to models/drawings; no IFC ingestion or version management; no 3D viewer or digital twin pathway.
3. **Documents & e-sign:** No contract lifecycle, document storage abstraction, approval flows, or e-sign integration; audit trail exists for app actions only.
4. **Media at scale:** Single storage backend; no CDN abstraction or multi-region media pipeline; no drone/scan ingestion pathway.
5. **Government/regulatory:** No permits, registries, or compliance reporting integrations.
6. **Public API:** No gateway, keys, sandbox, or partner-facing docs; no webhooks for outbound events.
7. **Marketplace:** No catalog of certified integrations; no submission or governance for third-party connectors.

---

## Top priority integrations

| Priority | Integration | Business value | Approach |
|----------|-------------|----------------|-----------|
| **1** | Public API platform | Partners and ISVs can build on AISTROYKA; revenue and ecosystem. | Gateway, keys, rate limits, sandbox, versioning (PUBLIC_API_PLATFORM). |
| **2** | ERP (one target) | Finance and project alignment; stickiness for GC and enterprise. | Pick one (e.g. 1C or Odoo); define mapping and flows (ERP_INTEGRATIONS). |
| **3** | Document/e-sign | Contracts and approvals; compliance and handover. | Lifecycle, storage, approval, e-sign pathways (DOCUMENT_AND_ESIGN). |
| **4** | BIM linkage | Tasks/reports tied to model; differentiation in construction. | Model linkage, IFC, versions, viewer pathway (BIM_INTEGRATIONS). |
| **5** | Media/storage scale | CDN and large/drone media; cost and performance. | Pipelines, abstraction, CDN (MEDIA_STORAGE_INTEGRATIONS). |
| **6** | Government/regulatory | Permits and compliance in regulated markets. | Permits, reporting, portals (GOVERNMENT_INTEGRATIONS). |
| **7** | Integration marketplace | Discoverable, certified connectors; partner revenue. | Catalog, certification, submission (INTEGRATION_MARKETPLACE). |

**Rule:** Each integration is modular; no core domain rewrite; tenant-safe and secure; standard protocols and formats where possible.
