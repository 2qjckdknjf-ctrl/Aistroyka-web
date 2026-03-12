# Developer Ecosystem

**Phase 13 — Strategic Moat & Category Leadership**  
**Developer portal, sandbox, API keys and quotas, samples, certification, grants and hackathons.**

---

## Developer portal

- **Purpose:** Single place for partners and ISVs to learn, get keys, read docs, and ship integrations. No discovery of API by trial-and-error.
- **Content:** (1) **Getting started:** Auth (API key, OAuth), base URL, first request. (2) **API reference:** OpenAPI-derived or hand-written; endpoints, request/response, errors. (3) **Guides:** Sync, webhooks (when available), rate limits, best practices. (4) **Changelog and versioning:** v1 vs v2, deprecation. (5) **Sandbox:** How to get sandbox key and base URL. (6) **Marketplace:** Link to integration catalog and submission.
- **Hosting:** Dedicated subdomain (e.g. developers.aistroyka.com) or path; static or docs platform (e.g. Docusaurus, ReadMe). Keep in sync with API and SDK releases.
- **Value:** Lower friction; more developers build; ecosystem grows. Platform dominance through developer adoption.

---

## Sandbox

- **Concept:** Isolated environment with same API surface, seeded test data (projects, tasks, reports), separate API keys and rate limits. No production data; no billing or real notifications. Phase 11 PUBLIC_API_PLATFORM.
- **Access:** Self-serve signup (e.g. “Get sandbox key” on portal) or form-to-email for Enterprise. Key and base URL (e.g. api-sandbox.aistroyka.com) in response.
- **Data:** Seed script for sample tenant; reset periodically or on request. Document in portal.
- **Value:** Safe experimentation; faster integration development; certification and demos without touching production.

---

## API keys and quotas

- **Keys:** Per-tenant or per-app; stored hashed; resolve tenant (and optional app_id) in gateway. Phase 11 PUBLIC_API_PLATFORM. Sandbox keys have separate quota and no billing.
- **Quotas:** Per key: request rate (e.g. 1000/hr) and optional usage cap (e.g. AI calls/month). Tier-based (Pro, Enterprise). Return 429 and Retry-After; header X-RateLimit-Remaining.
- **Self-serve:** Tenant admin creates key in product UI or portal; optional “request higher limit” for Enterprise. No key in logs; only key name or id.
- **Value:** Clear limits; fair use; upsell path. Developers know what they can do.

---

## Sample integrations

- **Concept:** **Sample code and mini-integrations** that show common patterns: “List projects,” “Create report with media,” “Poll for analysis result,” “Sync tasks.” Language: TypeScript/JavaScript, optionally Python. In repo or portal; runnable against sandbox.
- **Placement:** Developer portal or GitHub org; link from “Quick start.” Keep updated with API version.
- **Value:** Copy-paste start; fewer support questions; demonstrates best practice. Lowers time-to-first-call.

---

## Certification program

- **Concept:** **Developer or integration certification:** Pass a checklist (security, correct API use, docs, support) and get badge + listing. Aligns with Phase 11 INTEGRATION_MARKETPLACE (certified integration) and marketplace quality.
- **Tracks (optional):** (1) **Integration certification:** Connector or app reviewed; listed as Certified. (2) **Developer certification:** Individual or team completed training and passed quiz; badge for profile. (3) **Premier partner:** Strategic; co-marketing and SLA.
- **Process:** Submit integration or complete training → review or exam → approve → badge and listing. Re-certify on major API version.
- **Value:** Quality bar; customer trust; partners differentiate. Ecosystem stays healthy.

---

## Grants and hackathons

- **Grants:** Optional **small grants or credits** for building on AISTROYKA: e.g. “Build an ERP connector, get N months free + listing.” Or credits for API usage during build. Application and selection; terms public.
- **Hackathons:** Sponsor or run **construction-tech hackathons** (own event or with university/accelerator). Theme: “Build on AISTROYKA API”; sandbox and prizes. Showcase winners in blog and marketplace.
- **Value:** Pipeline of new integrations and developers; buzz; long-term ecosystem growth. Network effects.

---

## Implementation principles

- **No core domain rewrite:** Portal, sandbox, keys, and certification are additive. Core API unchanged.
- **Scalable ecosystems:** More developers and certified integrations → more value for customers → more adoption → more developers. Self-reinforcing.
- **Every initiative increases advantage:** Developer ecosystem is a moat: high switching cost for developers who have built on our API and certification.
