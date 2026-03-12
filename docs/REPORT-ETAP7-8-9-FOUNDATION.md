# Report: ETAP 7–9 Foundation (Integrations, Webhooks, API Gateway)

## Logo integration (ETAP 0)

- **`public/brand/aistroyka-logo.svg`** — Wordmark logo (header, sidebar).
- **`public/brand/aistroyka-icon.svg`** — Icon for favicon and collapsed sidebar.
- **`components/brand/Logo.tsx`** — Reusable `Logo` (href, height, iconOnly, onClick); uses Next.js `Image`.
- **Public header** — Logo left, link to `/`, responsive.
- **Dashboard sidebar** — Logo in sidebar header, link to `/dashboard`; closes sidebar on click (mobile).
- **Root layout metadata** — `metadataBase`, title template, openGraph (images, logo), icons (SVG + favicon.ico).
- **Structured data** — Organization and SoftwareApplication in public layout include `logo` and `image` URLs.
- See **docs/LOGO-INTEGRATION.md** for details and how to switch to official PNG.

---

## What was added

### ETAP 7 — Integration layer

- **`lib/integrations/integration.types.ts`** — `IntegrationType`, `IntegrationContext`, `IntegrationResult`, adapter interfaces (`IIntegrationAdapter`, `IErpAdapter`, etc.), `IntegrationError`.
- **`lib/integrations/base-adapter.ts`** — Abstract `BaseAdapter` with `isAvailable`, `healthCheck`, `withErrorBoundary`; config with `type` and `enabled`.
- **`lib/integrations/erp-adapter.ts`**, **document-adapter.ts**, **storage-adapter.ts**, **bim-adapter.ts**, **webhook-adapter.ts** — Concrete adapters extending `BaseAdapter`; each has config and returns `status: "scaffold"` from health check.
- **`lib/integrations/integration-registry.ts`** — `registerAdapter`, `getAdapter`, `setAdapterEnabled`, `isAdapterRegistered`, `getAvailableAdapter(ctx)`, `listRegisteredTypes`.
- **`lib/integrations/index.ts`** — Re-exports all types, adapters, and registry.
- **Removed:** Legacy `lib/integrations/adapters/*` (duplicate adapters using non-existent `IntegrationConfig`) to avoid type conflicts.

### ETAP 8 — Webhook system

- **`lib/webhooks/webhook.types.ts`** — `WebhookEventType`, `IncomingWebhookPayload`, `WebhookVerificationResult`, `WebhookHandleResult`, `OutgoingWebhookEvent`.
- **`lib/webhooks/webhook-verifier.ts`** — `verifyIncomingWebhook(request, bodyText, options)` (HMAC SHA-256 when secret set, max body size), `getReplayKey(payload)`.
- **`lib/webhooks/webhook-handler.ts`** — `handleIncomingWebhook(payload, options)` with optional replay check, mapping to `DomainEventType`, `createDomainEvent` + `publishDomainEvent`.
- **`lib/webhooks/index.ts`** — Re-exports.
- **`app/api/webhooks/incoming/route.ts`** — Updated to use verifier and handler; requires tenant (body `data.tenantId` or header `x-tenant-id`); returns `eventId` when accepted; integrates with domain events.

### ETAP 9 — API gateway foundation

- **`lib/api-gateway/api-response.ts`** — `ApiEnvelopeSuccess`, `ApiEnvelopeError`, `success()`, `apiError()`, `isApiError()`, `errorToStatus()`.
- **`lib/api-gateway/pagination.ts`** — `parseCursorPagination`, `parseOffsetPagination`, `normalizeLimit`, `normalizeOffset`, `DEFAULT_PAGE_LIMIT`, `MAX_PAGE_LIMIT`.
- **`lib/api-gateway/auth.ts`** — `requireApiAuth(request)` (returns `ApiAuthResult`), `getOptionalApiAuth(request)`.
- **`lib/api-gateway/index.ts`** — Re-exports.
- **`app/api/v1/users/route.ts`** — New scaffold: GET uses `requireApiAuth`, `parseOffsetPagination`, and `success()` envelope; returns `{ data: { users: [], meta: { limit, offset } } }`.

---

## What is scaffold

- **Integrations:** No real ERP, document, storage, BIM, or webhook outbound calls; no credentials or external APIs. Adapters are registered manually (no DB config). Retry is not implemented inside the layer.
- **Webhooks:** Replay protection is opt-in (caller provides `isReplay`); without `WEBHOOK_INCOMING_SECRET`, signature is not enforced. Outgoing delivery is not implemented.
- **API gateway:** Only `GET /api/v1/users` uses the new envelope/auth/pagination; other v1 routes (projects, tasks, reports, insights) are unchanged. No API key auth or rate limiting.

---

## What actually works

- **Integrations:** Registry and enable/disable; `getAdapter` / `getAvailableAdapter`; adapter `healthCheck` and `isAvailable` with tenant context; error boundary and `IntegrationError.retryable`.
- **Webhooks:** Verification with secret (HMAC); JSON and size validation; tenant resolution; domain event creation and `publishDomainEvent`; correct status and body for accepted/rejected/replay.
- **API gateway:** Envelope and error helpers; pagination parsing and limits; `requireApiAuth` using existing tenant context; `GET /api/v1/users` returns 401 without auth and 200 with auth and empty list.

---

## Extension points

- **Integrations:** Register real adapters at startup; implement methods (e.g. ERP sync) and tenant-specific config; add retry in callers using `retryable`.
- **Webhooks:** Add replay store and pass `isReplay`; set `WEBHOOK_INCOMING_SECRET` in production; implement outgoing delivery using `OutgoingWebhookEvent` and webhook adapter.
- **API gateway:** Refactor more v1 routes to use envelope and `requireApiAuth`; add API key resolution and rate limiting when needed.

---

## TODO

- Integration: per-tenant adapter config (e.g. from DB); real implementations for at least one type (e.g. webhook outbound).
- Webhook: idempotency store and wiring `isReplay`; enforce secret in production; outgoing sender.
- API: migrate other v1 endpoints to envelope; document versioning and deprecation policy; API keys if required.

---

## Files changed / added

**Added**

- `apps/web/public/brand/aistroyka-logo.svg`, `aistroyka-icon.svg`, `README.md`
- `apps/web/components/brand/Logo.tsx`
- `docs/LOGO-INTEGRATION.md`
- `apps/web/lib/integrations/integration.types.ts`
- `apps/web/lib/integrations/base-adapter.ts`
- `apps/web/lib/integrations/erp-adapter.ts`
- `apps/web/lib/integrations/document-adapter.ts`
- `apps/web/lib/integrations/storage-adapter.ts`
- `apps/web/lib/integrations/bim-adapter.ts`
- `apps/web/lib/integrations/webhook-adapter.ts`
- `apps/web/lib/integrations/integration-registry.ts`
- `apps/web/lib/integrations/index.ts`
- `apps/web/lib/webhooks/webhook.types.ts`
- `apps/web/lib/webhooks/webhook-verifier.ts`
- `apps/web/lib/webhooks/webhook-handler.ts`
- `apps/web/lib/webhooks/index.ts`
- `apps/web/lib/api-gateway/api-response.ts`
- `apps/web/lib/api-gateway/pagination.ts`
- `apps/web/lib/api-gateway/auth.ts`
- `apps/web/lib/api-gateway/index.ts`
- `apps/web/app/api/v1/users/route.ts`
- `docs/INTEGRATION-LAYER-FOUNDATION.md`
- `docs/WEBHOOK-FOUNDATION.md`
- `docs/API-GATEWAY-FOUNDATION.md`
- `docs/REPORT-ETAP7-8-9-FOUNDATION.md`

**Updated**

- `apps/web/app/layout.tsx` (metadata: title, openGraph, icons)
- `apps/web/app/[locale]/(public)/layout.tsx` (Organization logo, SoftwareApplication image)
- `apps/web/components/public/PublicHeader.tsx` (Logo in header)
- `apps/web/components/DashboardShell.tsx` (Logo in sidebar)
- `apps/web/app/api/webhooks/incoming/route.ts` (verifier + handler + tenant + domain event)

**Removed**

- `apps/web/lib/integrations/adapters/bim-adapter.ts`
- `apps/web/lib/integrations/adapters/erp-adapter.ts`
- `apps/web/lib/integrations/adapters/document-adapter.ts`
- `apps/web/lib/integrations/adapters/storage-adapter.ts`
- `apps/web/lib/integrations/adapters/webhook-adapter.ts`

---

## Build / typecheck / lint

- **Build:** `npm run build` in `apps/web` — **success**.
- **Typecheck:** Part of build — **no errors**.
- **Lint:** `npm run lint` — **no warnings or errors**.

Dashboard, auth, middleware, copilot, workflows, events, and audit were not modified; existing v1 routes and web app behavior are unchanged except for the new v1/users route and the updated webhooks/incoming handler.
