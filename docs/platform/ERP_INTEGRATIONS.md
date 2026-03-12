# ERP Integration Strategy

**Phase 11 — Ecosystem Integrations & Platformization**  
**Finance and project data mapping; no core domain rewrite.**

---

## Finance data model mapping

- **AISTROYKA today:** Projects (id, name, tenant_id); tasks (id, project_id, title, status, etc.); reports (id, project_id, task_id, status, etc.); no native cost, budget, or invoice entities.
- **ERP concepts:** Cost centers, projects/jobs, budget lines, cost codes, purchase orders, invoices, payments. Mapping is directional: AISTROYKA project ↔ ERP project/job; task or report can reference ERP cost code or PO (external_id or code field).
- **Direction:**  
  - **Outbound:** Project and task list (and optionally report summary) to ERP for cost/budget context.  
  - **Inbound:** Project/job list from ERP to prefill or sync projects; optional budget/cost code list for task tagging.
- **Format:** REST or file (CSV/XML); ERP-specific adapter per target. No single universal schema; define per partner (see targets below).

---

## Project budget sync

- **Source of truth:** ERP holds budget; AISTROYKA does not store budget. Sync = read-only from ERP or one-way push of “actuals” (e.g. report count, labor hours) from AISTROYKA to ERP.
- **Options:** (1) ERP exposes budget by project; we poll or receive webhook; display in dashboard (read-only). (2) We push summarized actuals (reports completed, tasks closed) to ERP; ERP reconciles. Prefer (2) for minimal ERP change; (1) for full visibility in AISTROYKA.
- **Data:** project_id (our) ↔ erp_project_id (theirs); period; budget_amount (if we display); actual_amount or actual_units (if we push). No double-entry in AISTROYKA.

---

## Cost tracking

- **AISTROYKA:** No cost ledger. Reports and tasks can carry optional external_id (e.g. cost code, PO line). Worker day and report count can be proxies for labor.
- **Outbound:** Push to ERP: project_id, task_id (or cost_code), report_id, quantity (e.g. 1 report), date, optional amount if we ever compute it. ERP posts to cost/job ledger.
- **Inbound:** Cost code or PO list from ERP for dropdown when creating/editing task (or report). Stored as reference only.
- **Partner API:** Each ERP has different APIs; we define one “ERP adapter” interface (fetch projects, push actuals, fetch cost codes) and implement per target.

---

## Procurement flows

- **AISTROYKA:** No PO or procurement. Optional: task or report can reference “purchase_request_id” or “po_line_id” (external) for traceability.
- **Flow:** (1) Manager creates task in AISTROYKA; optionally links to ERP PO line (if ERP exposes). (2) Worker completes and submits report. (3) We push completion to ERP; ERP can trigger receipt or approval. All ERP-specific; adapter per target.
- **Standard:** No UBL or cXML in scope initially; REST or file per ERP.

---

## Invoice flows

- **AISTROYKA:** No invoicing. Billing is platform subscription (Stripe); see REVENUE_OPERATIONS.
- **Customer invoicing (their ERP):** We do not generate customer-facing invoices for their clients. If needed, we expose “billable events” (e.g. reports by project/period) for them to feed into their ERP invoicing. Format: CSV or API (project_id, period, quantity, optional amount). Adapter per ERP.

---

## Partner API pathways (by target)

### 1C

- **Typical use:** RU/CIS; finance and project accounting. API: REST or OData; or file exchange (XML/CSV).
- **Mapping:** 1C project ↔ our project (external_id); 1C cost type ↔ our task or cost_code on report. Push: report/submit and task completion as “documents” or lines.
- **Auth:** 1C often uses basic or token; store per-tenant in integration config (encrypted). No 1C code in core; adapter in integration layer.

### SAP

- **Typical use:** Large enterprise; S/4HANA or ERP. API: OData, BAPI, or CPI. Project (WBS), cost center, internal order.
- **Mapping:** WBS ↔ project; cost element / order ↔ task or cost code. Push actuals via API or IDoc. Complex; prefer certified partner or SAP Integration Suite.
- **Pathway:** Adapter “SAP” implementing our ERP adapter interface; tenant config for endpoint and credentials.

### NetSuite

- **Typical use:** Mid-market; projects, jobs, expenses. REST (SuiteTalk 2.0) or SuiteScript.
- **Mapping:** NetSuite project ↔ our project; transaction (expense, journal) from our actuals. Push report/task completion as expense or custom record.
- **Pathway:** Adapter “NetSuite”; OAuth or token auth; per-tenant credentials.

### Odoo

- **Typical use:** SMB; projects, tasks, invoicing. XML-RPC or JSON-RPC; or REST (Odoo 14+).
- **Mapping:** Odoo project ↔ our project; Odoo task optional ↔ our task; timesheet or task done from our report. Push: create/update task or timesheet in Odoo on report submit.
- **Pathway:** Adapter “Odoo”; API key or session; per-tenant URL and key.

---

## Implementation principles

- **Modular:** One adapter per ERP; shared interface (sync projects, push actuals, fetch codes). No ERP logic in domain layer.
- **Tenant-safe:** Credentials and config per tenant; no cross-tenant data in ERP calls. Audit log for sync and push.
- **Idempotent:** Push with idempotency key or external_id so ERP can dedupe. Retry and backoff for transient failures.
- **Value first:** Start with one target (e.g. Odoo or 1C); prove mapping and flows; then add next. No big-bang multi-ERP in core.
