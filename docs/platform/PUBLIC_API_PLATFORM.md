# Public API Platform

**Phase 11 — Ecosystem Integrations & Platformization**  
**Gateway, auth, rate limits, SDK, versioning, sandbox; no core domain rewrite.**

---

## API gateway model

- **Current:** Next.js API routes under /api/v1; same auth (JWT from Supabase) as web/app. No separate “public” or “partner” gateway.
- **Target:** Optional API gateway in front of /api/v1 for partner traffic: (1) Route by path (e.g. /api/public/v1 or /api/partner/v1) or header (e.g. X-API-Key). (2) Resolve tenant and identity from API key or OAuth client. (3) Apply partner-specific rate limits and quotas. (4) Log and meter for billing. Gateway can be same Next.js with middleware or a separate proxy (Kong, Cloudflare, etc.).
- **Principle:** One backend; gateway only does auth, routing, and limits. No duplicate business logic.

---

## Auth and keys

- **Options:** (1) API key: per-tenant or per-app; key in header (e.g. X-API-Key or Authorization: Bearer api_key). Resolve tenant and optional “app” from key; no user context (machine-to-machine). (2) OAuth 2.0 client credentials: partner has client_id and client_secret; exchange for access_token; token in Authorization. (3) JWT from user (current): still supported for same-user integrations.
- **Recommendation:** Start with API key: simple; store key hash and tenant_id (and optional app_id) in DB; middleware resolves context. Add OAuth later for partners who require it. Keys are tenant-scoped; no cross-tenant key.
- **Storage:** api_keys table (or similar): tenant_id, key_hash, name, created_at, revoked_at. Never log or return raw key; only “key name” or id in logs.

---

## Rate limits

- **Current:** Per-tenant and per-IP (rate_limit_slots); limits from subscription tier. See MULTI_TENANT_SCALING.
- **Public API:** Apply per key (or per client_id) in addition to per-tenant. Example: 1000 req/hour per key for Pro; 10000 for Enterprise. Return 429 and Retry-After; header X-RateLimit-Remaining. Same rate_limit store or separate counter per key.
- **Quotas:** Optional request or usage quota per key (e.g. AI calls per month). Enforce in middleware or route; reject with 402 or 429 when exceeded.

---

## SDK strategy

- **Purpose:** Partners and ISVs can integrate faster with typed client (JS/TS, Python, etc.) instead of raw REST.
- **Content:** (1) OpenAPI spec (already contracts package); publish at /api/public/v1/openapi.json or docs site. (2) Generated client: from OpenAPI generate TypeScript/JavaScript and optionally Python; publish to npm/PyPI or private registry. (3) Docs: authentication, rate limits, examples, error codes. No SDK in core repo; generate from spec and maintain in separate repo or CI.
- **Versioning:** SDK version matches API version (e.g. v1); changelog and migration guide on breaking changes. See versioning below.

---

## Versioning

- **Policy:** URL path version: /api/v1 (current). New non-breaking fields and endpoints in v1. Breaking change (e.g. remove field, change type) = new version /api/v2. Deprecation: announce v1 deprecation N months before; support v1 until end-of-life. See API-RELEASE-POLICY if present.
- **Public API:** Same versioning. Document in developer portal: “v1 is stable; v2 will be announced with migration guide.” No version in URL for “latest” to avoid surprise breaks; require explicit /v1 or /v2.

---

## Sandbox environment

- **Purpose:** Partners and developers test without production data. Sandbox = separate deployment (or tenant) with: (1) Same API surface. (2) Test data (seeded projects, tasks, reports). (3) Separate API keys and rate limits. (4) No billing or real notifications.
- **Implementation:** Staging or dedicated “sandbox” env; seed script for test tenant and data. Partner signs up for sandbox key from portal or form. Document base URL and key request process.
- **Value:** Safe integration development; no risk to production; reproducible demos.

---

## Implementation principles

- **Modular:** Gateway and key auth are middleware or proxy; existing routes unchanged. New routes under /api/public/v1 if needed, or same routes with key auth when X-API-Key present.
- **Tenant-safe:** Key always resolves to one tenant; no cross-tenant access. Audit API calls by key_id and tenant_id.
- **Standard:** REST, OpenAPI, OAuth2 when used; standard rate limit headers. No proprietary auth in long term.
- **Value first:** Ship API key auth and rate limits first; then sandbox and SDK; then OAuth if demanded.
