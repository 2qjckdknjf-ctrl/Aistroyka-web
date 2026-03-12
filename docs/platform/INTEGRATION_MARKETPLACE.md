# Integration Marketplace Ecosystem

**Phase 11 — Ecosystem Integrations & Platformization**  
**Partner catalog, certification, revenue share, submission, governance.**

---

## Partner catalog

- **Purpose:** Discoverable list of integrations (ERP, BIM, document, storage, etc.) that partners or we provide. Each listing: name, category, description, logo, link to docs or setup, certification badge.
- **Content:** Static page or simple CMS (e.g. markdown + metadata). Categories: ERP, BIM & Design, Documents & E-Sign, Storage & Media, Government & Compliance, Other. Filter by industry or use case when possible.
- **No app store in product:** Listings are marketing and docs; installation or “connect” is per-integration (e.g. OAuth, API key, or admin config). No in-app “install app” flow in core; optional “connected integrations” in tenant settings later.
- **Value:** Partners get visibility; customers find integrations; we avoid one-off “do you integrate with X?” without a home.

---

## Certification

- **Tiers:** (1) **Listed:** Integration is in catalog; no formal review. (2) **Certified:** Reviewed for security, data handling, and correct use of API; badge and support note. (3) **Premier:** Certified + SLA and co-marketing; for strategic partners. See PARTNER_PROGRAM for partner-level certification; here = integration-level.
- **Process:** Partner submits integration (form + docs + optional code or connector). We review: does it use public API correctly? Any PII or credential handling issues? Test against sandbox. Approve or request changes. Publish as Listed or Certified.
- **Criteria:** Uses only public or documented API; no scraping or unsupported access; privacy and tenant isolation respected; documentation and support contact. No security review of partner’s full product; only “integration with us” scope.
- **Value:** Trust for customers; quality bar; differentiation for certified connectors.

---

## Revenue share

- **Model:** (1) No rev share: free listing; partner monetizes their side. (2) Referral: we refer customer to partner (e.g. implementation); partner pays referral fee. (3) Revenue share: partner sells our subscription or add-on; we share revenue per PARTNER_PROGRAM. (4) Listing or placement fee: partner pays to be featured (optional; use sparingly).
- **Document:** Per-partner agreement; marketplace page states “partners are independent; revenue terms per agreement.” No rev share in product code; only in contracts and ops.
- **Value:** Incentive for partners to build and list; our revenue from ecosystem.

---

## Integration submission

- **Flow:** (1) Partner registers (or already in partner program). (2) Submits integration: name, category, description, logo, setup docs URL, support contact, optional connector package or repo link. (3) We review (security, correctness, docs). (4) Approve → add to catalog with status Listed or Certified. (5) Partner can update listing; we re-review on significant change.
- **Form:** Web form or email template; store in spreadsheet or simple DB. No “marketplace backend” in core product; ops-driven.
- **Value:** Clear path for partners; we control what’s listed and certified.

---

## Governance rules

- **Listing rules:** (1) Integration must work with current public API (or documented private API if partner). (2) No misleading claims; no abuse of our brand. (3) Partner responsible for their app security and compliance. (4) We can remove listing if terms violated or integration broken.
- **Data and security:** (1) Partner must not store our customer data beyond what’s needed for integration; no resale. (2) Credentials (API keys, OAuth) must be handled securely; document in partner docs. (3) Tenant isolation: partner must not mix data across tenants. (4) Incident: partner must report security or data incident affecting our customers; we can suspend key or listing.
- **Legal:** Partner agreement and marketplace terms (one-page); link from catalog. No legal in core code; only process and docs.
- **Value:** Protect customers and platform; keep ecosystem trustworthy.

---

## Implementation principles

- **Modular:** Catalog and certification are process and content; no core domain change. Optional “connected integrations” in settings = list of tenant’s API keys or OAuth connections; stored per tenant.
- **Tenant-safe:** Catalog is read-only for customers; submission and approval are ops. No cross-tenant data in marketplace.
- **Standard:** Publish API and security expectations; partners build to spec. Revenue share and governance are contractual.
- **Value first:** Launch with simple catalog (listed integrations) and one certified example; add certification process and revenue share as partners grow.
