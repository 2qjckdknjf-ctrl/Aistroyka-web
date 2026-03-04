# API Versioning Specification

**Project:** AISTROYKA.AI  
**Version:** 1.0  
**Status:** Spec (Phase 0.1). No code changes in this document.

---

## 1. Canonical versioned API: /api/v1

- **/api/v1** is the canonical base path for all future clients (Web, iOS Full, iOS Lite, Android).
- New and changed behavior is introduced under **/api/v1** first. Legacy **/api** (unversioned) routes remain for backward compatibility and are implemented as **adapters** that delegate to the same handlers as v1 where applicable.
- No **/api/v2** until v1 is deprecated or a major break is required; then a clear deprecation window and migration path will be defined.

---

## 2. Compatibility plan: legacy /api/* as adapters

- **Existing routes** under `/api/*` (e.g. `/api/health`, `/api/ai/analyze-image`, `/api/projects`) stay in place and keep their current behavior.
- **Strategy:** Extract shared logic into **lib/controllers/** (or equivalent) so that:
  - **/api/v1/health** and **/api/health** both call the same handler; response shape may be normalized in v1 (e.g. validated against a contract).
  - **/api/v1/ai/analyze-image** and **/api/ai/analyze-image** use the same AIService and validation; v1 may add request/response validation via shared contracts.
  - **/api/v1/projects** and **/api/projects** share the same list/create logic.
- **Tests:** Existing tests that hit **/api/health** and **/api/ai/analyze-image** continue to pass without change. New tests assert **/api/v1/health** and **/api/v1/ai/analyze-image** and that they match the v1 contract.

---

## 3. Introducing v1 without breaking existing tests

- **Add** new route files under **app/api/v1/** (e.g. `app/api/v1/health/route.ts`, `app/api/v1/ai/analyze-image/route.ts`). These call shared handlers and return responses that conform to v1 contracts.
- **Do not remove or change** the existing **/api/health** or **/api/ai/analyze-image** route URLs or default response shape until a deprecation plan is in place.
- **Shared handler pattern:** e.g. `getHealthResponse()` in lib returns the same object; legacy route returns it as-is; v1 route validates and returns it (or 500 if validation fails in dev). This keeps existing tests green while adding v1 coverage.

---

## 4. Required and optional headers

| Header          | Required | Values | Purpose |
|-----------------|----------|--------|---------|
| **x-client**    | Yes for v1 | `web` \| `ios_full` \| `ios_lite` \| `android_full` \| `android_lite` | Client identification; analytics and client-specific behavior. Default `web` if omitted for backward compatibility during rollout. |
| **x-request-id** | No    | UUID or opaque string | Correlation id; if present, use as traceId; otherwise generate. |

- **Content-Type:** For JSON bodies, `application/json` is required on POST/PUT.
- **v1 routes** should accept **x-client** and **x-request-id**; store in TenantContext or request context for logging and metrics.

---

## 5. Backward compatibility rules

- **Legacy /api/*:** No new required headers; behavior unchanged. Optional **x-request-id** can be honored for tracing.
- **/api/v1/*:** May require **x-client** after a grace period (default `web` if missing). Response shape is stable and validated by contracts; no undocumented fields removed without a version bump or deprecation.
- **Breaking changes:** New required fields in request or removed fields in response → introduce a new version (e.g. v2) or a new endpoint path with a deprecation timeline for the old one.
- **Additive changes:** New optional request fields or new response fields are allowed in v1 without a new version.

---

## 6. Worker and future endpoints under v1

- **/api/v1/worker/** is reserved for Worker Lite (and future mobile) endpoints: check-in, before/after photo, minimal text, upload sessions, async AI.
- Initially these can return **501 Not Implemented** with a JSON body that references this spec and the contracts placeholder. No behavior change for existing clients.

---

*End of SPEC-API-VERSIONING. Implementation follows in Phase 0.4.*
