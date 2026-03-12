# Marketplace Network Effects

**Phase 13 — Strategic Moat & Category Leadership**  
**Integration marketplace model, listing process, quality certification, revenue sharing, discovery UX, ecosystem growth loops.**

---

## Integration marketplace model

- **Concept:** Discoverable **catalog of integrations** (ERP, BIM, document, storage, government, etc.) that connect to AISTROYKA. Each listing: name, category, description, logo, setup link, certification badge. Phase 11 INTEGRATION_MARKETPLACE. Here we emphasize **network effects**: more integrations → more customer value → more deals → more partners list → more integrations.
- **Roles:** (1) **Platform:** Curates, certifies, hosts catalog, governs listing. (2) **Partners:** Build and submit integrations; maintain docs and support. (3) **Customers:** Discover and connect; optional “connected integrations” in tenant settings.
- **No in-app app store (v1):** Listings are marketing and docs; “connect” is per-integration (OAuth, API key, admin config). Optional later: in-product “Connected integrations” panel with deep links to setup.
- **Value:** Single place for “does AISTROYKA work with X?”; reduces friction in sales; ecosystem becomes a differentiator.

---

## Partner listing process

- **Flow:** (1) Partner registers or is in partner program. (2) Submits integration: name, category, description, logo, docs URL, support contact, optional repo or package. (3) Review: security, correct API use, docs quality, tenant isolation. (4) Approve → Listed or Certified. (5) Updates trigger re-review on significant change. Phase 11 INTEGRATION_MARKETPLACE.
- **Form:** Web form or email; store in CMS or simple DB. Ops-driven; no complex marketplace backend in core product.
- **Value:** Clear path for partners; we control quality and positioning; scalable process.

---

## Quality certification

- **Tiers:** **Listed** (in catalog; no formal review); **Certified** (reviewed for security, API use, docs; badge); **Premier** (certified + SLA, co-marketing). Phase 11 INTEGRATION_MARKETPLACE.
- **Criteria:** Uses only public/documented API; no scraping; secure credential handling; tenant isolation; documentation and support. Review against sandbox when possible.
- **Value:** Customer trust; “Certified” badge differentiates; partners invest in quality to get certified. Quality bar raises ecosystem value.

---

## Revenue sharing

- **Models:** (1) Free listing; partner monetizes their side. (2) Referral: we refer customer to partner; partner pays referral fee. (3) Revenue share: partner sells our subscription or add-on; we share per PARTNER_PROGRAM. (4) Optional: listing/placement fee for featured. Phase 11 INTEGRATION_MARKETPLACE; docs/market PARTNER_PROGRAM.
- **Governance:** Per-partner agreement; marketplace page states “partners are independent; terms per agreement.” No rev share logic in core product; contracts and ops.
- **Value:** Incentivizes partners to build and promote; our revenue from ecosystem; alignment of interests.

---

## Discovery UX

- **Concept:** Customers and prospects find integrations easily: by category (ERP, BIM, Documents, etc.), by vendor name, or by use case (“sync to SAP,” “e-sign”). Filter and search; mobile-friendly.
- **Content:** Each card: name, short description, logo, “Certified” badge, link to setup or docs. Optional: “Most used” or “Recommended” (curated, not algorithmic in v1).
- **Placement:** Public marketplace page (e.g. marketplace.aistroyka.com) or section on main site; link from product and sales. Optional: in-app “Integrations” with same list and “Connect” deep links.
- **Value:** Reduces “do you integrate with X?”; supports sales and retention; partners get traffic.

---

## Ecosystem growth loops

- **Loop 1:** More quality integrations → more customer value → more wins and retention → more partners want to list → more integrations. Reinforced by certification and discovery.
- **Loop 2:** Revenue share and grants → more partners build → more listings → more customer choice → more adoption. Incentives align.
- **Loop 3:** Developer portal + sandbox + samples → more developers try → more ship integrations → more listings → more developers see success and join. Developer ecosystem feeds marketplace.
- **Measurement:** Listings count, certified count, “connected” count per tenant (when we track), partner pipeline. Track and report internally; optional public “N+ integrations” on marketplace.
- **Value:** Network effects make the platform more valuable as the ecosystem grows; long-term defensibility.

---

## Implementation principles

- **No core domain rewrite:** Marketplace is catalog, process, and UX; optional “connected integrations” is list of tenant’s connections. Core domain unchanged.
- **Scalable ecosystems:** We don’t build every connector; we enable and curate. Growth loops scale with partners and developers.
- **Every initiative increases advantage:** Marketplace is a moat: customers with many connected integrations have higher switching cost and more reasons to stay.
