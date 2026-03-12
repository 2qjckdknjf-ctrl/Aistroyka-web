# Government & Regulatory Integrations

**Phase 11 — Ecosystem Integrations & Platformization**  
**Permits, registries, reporting, procurement, compliance; no core domain rewrite.**

---

## Permits

- **Concept:** Construction often requires permits (building, environmental, etc.). We do not issue permits; we can link tasks or projects to permit references and optional status (e.g. permit_id, status from registry).
- **Data:** Optional on project: permit_ids[], or permit_number, issuing_authority, valid_until. Tasks can reference permit (e.g. “inspection for permit X”). Source: manual entry or API from government/portal when available.
- **Integration:** If government exposes permit status API (by number or project), we poll or receive webhook; display status and expiry. Adapter per region/authority; no universal permit API. Store only ref and status; no permit issuance in our system.
- **Value:** Visibility of permit status and due dates; alerts when permit nearing expiry; compliance evidence.

---

## Registries

- **Concept:** Registries (e.g. contractor license, equipment, qualifications) may be required for bidding or compliance. We can store “registry entries” or links: contractor_id, registry_type, registry_number, verified_until. Source: manual or API from registry when available.
- **Data:** Optional entity or JSON: tenant_id, external_ref (contractor/user), registry_type, number, status, verified_at. Used for filtering (e.g. “only show workers with valid license”) or reporting.
- **Integration:** Per-region; some registries have public API or file; we read and cache. No write to registry from our side. Modular adapter per registry.
- **Value:** Compliance and audit; avoid assigning work to unqualified; reporting for authorities.

---

## Reporting

- **Concept:** Mandatory reporting to authorities (e.g. accidents, hours, environmental). We can export data in required format (CSV, XML, or API) from our audit and report data. We do not submit automatically unless API exists and we implement adapter.
- **Data:** Reports, tasks, worker days, incidents (if we add). Export by period and project; map to authority schema. Adapter per report type and region.
- **Format:** Often prescribed (e.g. XSD, CSV template). We generate file or payload from our data; customer or we submit via portal or API. Audit “report_exported” for compliance.
- **Value:** One source of truth for field data; export for regulatory submission; reduce manual re-entry.

---

## Procurement portals

- **Concept:** Public procurement (e.g. government tenders) may require submission via official portal. We do not replace portal; we can prepare data (company, project, documents) for upload to portal or handoff to partner.
- **Flow:** (1) Customer prepares response in AISTROYKA (e.g. project plan, team, documents). (2) Export in portal-accepted format or via portal API if available. (3) Submit via portal (manual or adapter). Adapter per portal and region.
- **Value:** Reuse project and document data for bids; less duplicate data entry.

---

## Compliance reporting

- **Concept:** Internal or external compliance (safety, quality, environmental). We already have audit_logs and report data. Extend with: (1) Tagging (e.g. report tagged “safety_incident”). (2) Export or dashboard for compliance officer. (3) Optional push to compliance system (partner or authority) when API exists.
- **Data:** No new domain entity; use report status, audit events, and optional tags. Compliance report = filtered export or API response by period, project, tag.
- **Value:** Evidence for audits; faster compliance reviews; optional integration with compliance platforms.

---

## Implementation principles

- **Modular:** Each government/regulatory integration is adapter (per country or portal). No government logic in core domain. Credentials and endpoints per tenant or region.
- **Tenant-safe:** All data and exports scoped by tenant; no cross-tenant access. Audit who exported what and when.
- **Standard formats:** Use prescribed CSV/XML/API when required; document mapping. Prefer read-only (we export or read status); write only when contract and API allow.
- **Value first:** Start with one report type or one registry in one region; prove flow; then expand. No big-bang multi-region compliance in core.
