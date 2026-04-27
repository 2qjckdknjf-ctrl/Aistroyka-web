# Billing Readiness Architecture (Step 12–13, Step 18, Step 19)

**Status:** Provider-agnostic architecture. Adapter layer + sandbox simulation. Live billing **not** globally enabled. Controlled pilot rollout only (Step 18). Internal ops tooling (Step 19).

## Separation of concerns

| Concept | Source | Purpose |
|--------|--------|---------|
| **Selected plan** | `workspace_plan_state` | What user/system chose as product plan |
| **Billing subscription** | `billing_readiness_subscriptions` | Commercial/payment state (provider-agnostic lifecycle) |
| **Effective entitlements** | Plan-fit resolution | What workspace actually has at runtime |

- **Selected plan** can exist without an active billing subscription (current state).
- **Future billing subscription** may confirm/override selected plan.
- **Effective entitlements** currently derive from selected plan + runtime rules; later may include billing status.

## Domain model

### BillingCustomer

- `workspaceId`, `providerCustomerRef`, `billingEmail`, `status`, `meta`

### BillingSubscription

- `id`, `workspaceId`, `canonicalPlanCode`, `billingProvider`, `providerSubscriptionRef`
- `status`, `billingCycle`, `trialStatus`
- `currentPeriodStart`, `currentPeriodEnd`, `cancelAtPeriodEnd`
- `startedAt`, `endedAt`, `createdAt`, `updatedAt`

### BillingCheckoutSession

- `id`, `workspaceId`, `targetPlanCode`, `requestedBillingCycle`

### BillingEvent

- `id`, `workspaceId`, `billingProvider`, `providerEventRef`, `eventType`
- `eventPayloadSnapshot`, `processingStatus`, `processedAt`, `receivedAt`, `errorInfo`

### TrialState

- `id`, `workspaceId`, `kind`, `status`, `startedAt`, `endsAt`, `source`, `trialPlanCode`
- `convertedAt`, `cancelledAt`

## Status enums

- **Subscription:** `pending`, `trialing`, `active`, `past_due`, `cancelled`, `expired`, `incomplete`, `paused`, `unknown`
- **Checkout session:** `created`, `pending_redirect`, `completed`, `cancelled`, `expired`, `failed`
- **Billing provider:** `none`, `stripe`, `paddle`, `manual`, `legacy`, `sandbox`
- **Trial:** `not_started`, `active`, `expired`, `converted`, `cancelled`

## Persistence

- **Tables:** `billing_readiness_customers`, `billing_readiness_subscriptions`, `billing_readiness_checkout_sessions`, `billing_readiness_events`, `billing_readiness_trial_state`
- **Readiness-only:** No production billing enforcement.
- **Additive:** No changes to legacy `billing_customers` or `entitlements`.

## Event / webhook readiness

- **Idempotency:** `provider_event_ref` + unique index per provider.
- **Processing status:** `pending`, `processed`, `failed`, `skipped`.
- **Real webhook (Step 17):** `POST /api/v1/billing/webhooks/stripe` — behind `ENABLE_STRIPE_WEBHOOK_INGRESS` flag.

## Provider adapter layer (Step 13, Step 15)

- **Interface:** `BillingProviderAdapter` — `createCheckoutSession`, `translateProviderEvent`, `getProviderKind`
- **Registry:** `getBillingAdapter(providerKind)`, `getConfiguredBillingAdapter()`, `getDefaultBillingAdapter()` — resolves by config
- **Sandbox adapter:** No external API calls. Returns `mode: sandbox_simulation`, no redirect URL.
- **Stripe adapter skeleton (Step 15):** Behind `ENABLE_STRIPE_BILLING_PROVIDER` + valid config. Returns `provider_ready_stub` (no live checkout). Event translation for `checkout.session.completed`, `customer.subscription.*`. See `docs/architecture/STRIPE_ADAPTER_SKELETON.md`.

## Provider config / feature flag (Step 15, Step 16)

| Provider flag | Live flag | Config | Price mapping | Result |
|---------------|-----------|--------|---------------|--------|
| OFF | — | — | — | Sandbox |
| ON | OFF | valid | — | provider_ready_stub |
| ON | ON | valid | missing | provider_disabled_fallback |
| ON | ON | valid | valid | provider_live_checkout |

- **Flags:** `ENABLE_STRIPE_BILLING_PROVIDER`, `ENABLE_STRIPE_LIVE_CHECKOUT` (default OFF), `ENABLE_STRIPE_WEBHOOK_INGRESS` (default OFF)
- **Config:** `STRIPE_SECRET_KEY` (sk_*), `STRIPE_WEBHOOK_SECRET` (whsec_*)
- **Price mapping:** `STRIPE_PRICE_{PLAN}_{CYCLE}` — e.g. `STRIPE_PRICE_TEAM_CONTRACTOR_MONTHLY`
- **Fallback:** Invalid config or missing mapping → sandbox or controlled error.

## Provider session ref / lookup (Step 16)

- `updateBillingCheckoutSessionProviderRef` — persist Stripe `cs_` id after live session creation
- `getBillingCheckoutSessionByProviderRef` — lookup by provider ref for webhook/event reconciliation
- Event processor uses `resolveCheckoutSession` (by id or provider_ref)

## Return / cancel boundary (Step 16)

- Success: `/billing/return` — "Checkout initiated / awaiting confirmation". No immediate entitlement.
- Cancel: `/billing/cancel` — "Checkout cancelled".
- Activation via webhook/event processor only.

## Pilot rollout (Step 18, Step 19)

- **Workspace-level eligibility:** Live checkout and webhook processing require both **global readiness** and **workspace in pilot cohort**.
- **Allowlist:** Hybrid — DB `billing_pilot_workspaces` first, then `BILLING_PILOT_WORKSPACE_IDS` (env). No cohort = no live billing.
- **Resolution:** `resolveBillingPilotEligibility(supabase, workspaceId)` → `BillingPilotDecision` (liveCheckoutEligible, webhookProcessingEligible, mode, reason).
- **Coherence:** Checkout and webhook use the same resolution; workspace not in pilot → sandbox/provider stub for checkout, skipped processing for webhook.
- **Diagnostics:** `GET /api/v1/admin/billing/pilot-status?workspaceId=...` — workspace-scoped pilot decision and reasons.
- See `docs/architecture/BILLING_PILOT_ROLLOUT.md`.

## Provider webhook ingress (Step 17, Step 18)

- **Endpoint:** `POST /api/v1/billing/webhooks/stripe`
- **Verification:** Stripe signature verification; raw body required
- **Idempotency:** `getBillingEventByProviderRef` + unique (billing_provider, provider_event_ref)
- **Flow:** verify → record → resolve workspace pilot eligibility → process only if eligible; else skip (no mutation of live billing state)
- **Controlled:** `ENABLE_STRIPE_WEBHOOK_INGRESS` default OFF; webhook processing additionally gated by workspace pilot eligibility

## Billing event processor (Step 14)

- **Translation boundary:** Adapter `translateProviderEvent` → canonical `BillingTranslatedEvent`
- **Processor:** `processBillingEventRecord`, `processPendingBillingEvents`, `processTranslatedBillingEvent`
- **Reconciliation:** Provider-agnostic rules; applied in `applyReconciliation`
- **Idempotency:** Event-record level (already processed → noop); reconciliation level (already in target state → idempotentHit)
- **Provider-ready slot:** Future Stripe/Paddle adapter translates raw → same `BillingTranslatedEvent` → same processor

See `docs/architecture/BILLING_EVENT_PROCESSOR.md`.

## Sandbox flow

- **Create checkout:** Creates session record, adapter returns sandbox result
- **Complete:** `POST /api/v1/billing/sandbox/complete` — record event → processor → session completed, subscription created if none
- **Cancel:** `POST /api/v1/billing/sandbox/cancel` — record event → processor → session cancelled
- **Reconciliation:** Same processor path as future provider adapter

See `docs/architecture/BILLING_SANDBOX_FLOW.md`.

## API

- `GET /api/v1/billing/overview` — Billing overview (selected plan, status, adapter diagnostics)
- `POST /api/v1/billing/checkout-readiness` — Create checkout session (resolved adapter; sandbox by default)
- `POST /api/v1/billing/webhooks/stripe` — Stripe webhook ingress (no auth; signature verified)
- `POST /api/v1/billing/sandbox/complete` — Internal: simulate checkout completion (billing:admin)
- `POST /api/v1/billing/sandbox/cancel` — Internal: simulate checkout cancellation (billing:admin)
- `POST /api/v1/admin/billing/process-pending-events` — Internal: reprocess pending events (admin:write)
- `GET /api/v1/admin/billing/provider-status` — Internal: provider diagnostics (admin:read)
- `GET /api/v1/admin/billing/pilot-status?workspaceId=...` — Internal: workspace pilot diagnostics (admin:read)
- `GET /api/v1/admin/billing/pilot-workspaces` — Internal: list pilot cohort (admin:read)
- `POST /api/v1/admin/billing/pilot-workspaces` — Internal: add to cohort (admin:write)
- `DELETE /api/v1/admin/billing/pilot-workspaces/:workspaceId` — Internal: remove from cohort (admin:write)
- `GET /api/v1/admin/billing/workspace-status?workspaceId=...` — Internal: full workspace diagnostics (admin:read)
- `POST /api/v1/admin/billing/reprocess-event` — Internal: reprocess single event (admin:write)
- `POST /api/v1/admin/billing/reprocess-workspace-events` — Internal: reprocess workspace events (admin:write)

## Ops / observability (Step 19)

- **Cohort management:** Add/remove workspaces via admin routes; DB overrides env
- **Workspace diagnostics:** Checkout, subscription, event counts, last failure, pilot reason
- **Reprocess:** Single event or workspace-scoped; idempotent for already-processed; failed → reset to pending then process
- **Internal UI:** `/[locale]/admin/billing-pilot` — minimal ops screen
- **No self-serve:** All pilot actions admin-only

## Safety

- No real provider integration (unless explicitly enabled and workspace in pilot).
- No real checkout redirect for workspaces outside pilot.
- No payment capture for non-pilot workspaces.
- No access enforcement changes (billing-based access gating not introduced).
- Legacy selected plan and plan-fit remain unchanged.
- **Live billing is not globally enabled;** rollout requires both global flags and workspace eligibility.
