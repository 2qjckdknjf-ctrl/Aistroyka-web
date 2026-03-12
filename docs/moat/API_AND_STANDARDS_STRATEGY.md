# API & Standards Dominance Strategy

**Phase 13 — Strategic Moat & Category Leadership**  
**Public schemas, SDK roadmap, reference connectors, open contracts, versioning, industry standard positioning.**

---

## Public schemas

- **Concept:** Publish **canonical schemas** for construction-relevant resources: project, task, report, media, analysis result, sync payloads. Machine-readable (JSON Schema, OpenAPI); human-readable docs. Anyone can implement compatible systems without reverse-engineering.
- **Scope:** Start with core entities (project, task, report, media) and AI analysis shape. Extend to ERP mapping (e.g. cost code, budget line), BIM reference (element id), document reference when those integrations exist (Phase 11).
- **Placement:** Developer portal; optional standalone “AISTROYKA Schema Registry” or open repo. Versioned (v1, v2); changelog on breaking changes.
- **Value:** Reduces integration cost; partners and ERPs build to our spec; we become the **reference definition** for construction field data interchange.

---

## SDK roadmap

- **Current:** OpenAPI in contracts package; no published SDK. Phase 11 PUBLIC_API_PLATFORM: generate client from spec.
- **Roadmap:** (1) **TypeScript/JavaScript:** Generated from OpenAPI; publish to npm (public or scoped). (2) **Python:** Generated or hand-maintained; PyPI. (3) **Optional:** Go, .NET when demand exists. (4) SDK version tied to API version; migration guide on breaking changes.
- **Content:** Auth (API key, OAuth), rate limits, retries, pagination, error handling. No business logic in SDK; thin client. Docs and examples in developer portal.
- **Value:** Faster partner integration; fewer support tickets; ecosystem builds on standard client. Dominance through adoption.

---

## Reference connectors

- **Concept:** **Official or certified reference connectors** for high-value targets: e.g. one ERP (Odoo or 1C), one BIM viewer, one document provider. Open-source or documented; partners can fork or mirror for other systems.
- **Role:** Prove API and schema; show best practices (idempotency, error handling, tenant isolation). Reference implementation = de facto standard.
- **Maintenance:** Owned by platform or key partner; kept in sync with API version. Listed prominently in marketplace and docs.
- **Value:** Lowers “first integration” barrier; demonstrates interoperability; encourages “build like reference” across ecosystem.

---

## Open API contracts

- **Concept:** API contract (OpenAPI 3.x) is **public and stable**. Published at predictable URL; no “private” or undocumented endpoints for partners. Deprecation and versioning policy public (see API-RELEASE-POLICY, Phase 11 PUBLIC_API_PLATFORM).
- **Governance:** Breaking change = new version (e.g. /v2); v1 supported until EOL with notice. Non-breaking additions in v1. Changelog and migration guide for every release.
- **Value:** Partners can depend on contract for CI and compatibility; we are the **single source of truth** for “AISTROYKA API.” Standards dominance.

---

## Versioning governance

- **Policy:** URL path version (/api/v1, /api/v2). No breaking change without new version. Deprecation: announce N months (e.g. 12); support old version until EOL. Document in developer portal and release notes.
- **Governance body (optional):** Internal API council or public “API advisory” for major version decisions. Ensures consistency and predictability.
- **Value:** Long-term trust; enterprises and partners plan migrations; we avoid “breaking the ecosystem” reputation.

---

## Industry standard positioning

- **Narrative:** “AISTROYKA defines the open, API-first way to exchange construction field data, AI insights, and project state.” Not just a product—the **platform others integrate with**.
- **Tactics:** (1) Publish schemas and contract; (2) reference connectors and SDK; (3) participate in standards bodies (buildingSMART, ISO, or regional construction data groups) with our schema as input; (4) blog and conference talks on “construction API standard”; (5) encourage “powered by AISTROYKA” or “compatible with AISTROYKA API” in partner marketing.
- **Value:** Category leadership; partners and ERPs adopt our format → switching cost and lock-in at the ecosystem level; we become the digital standard.

---

## Implementation principles

- **No core domain rewrite:** Schemas and SDK describe existing API; gateway and versioning are routing and policy. Core domain unchanged.
- **Scalable ecosystems:** Open contract and reference connectors enable many third parties; we don’t build every connector ourselves.
- **Every initiative increases advantage:** Each published schema, SDK, and reference connector raises the cost for competitors to displace us as the integration hub.
