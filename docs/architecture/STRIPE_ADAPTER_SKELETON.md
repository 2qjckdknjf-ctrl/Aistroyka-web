# Stripe Adapter (Step 15, Step 16, Step 17, Step 18)

**Purpose:** Provider-ready boundary behind feature flags. Skeleton when live off; real checkout when live on; real webhook ingress when enabled. **Step 18:** Live billing additionally gated by workspace pilot eligibility.

## Policy

- **Provider skeleton ≠ production-enabled billing.**
- **Live checkout** requires separate flag. Default OFF.
- **Webhook ingress** requires separate flag. Default OFF.
- **Step 18:** Live checkout and webhook processing additionally require **workspace in pilot cohort** (`BILLING_PILOT_WORKSPACE_IDS`). No cohort = no live checkout, no live webhook processing.
- Stripe adapter available when `ENABLE_STRIPE_BILLING_PROVIDER=true` and config valid.
- Real checkout when `ENABLE_STRIPE_LIVE_CHECKOUT=true` + valid config + price mapping + **workspace eligible**.
- Real webhook when `ENABLE_STRIPE_WEBHOOK_INGRESS=true` + valid config + **workspace eligible**.

## Flag matrix

| Provider flag | Live flag | Webhook flag | Config | Price mapping | Result |
|---------------|-----------|--------------|--------|---------------|--------|
| OFF | — | — | — | — | Sandbox |
| ON | OFF | OFF | valid | — | provider_ready_stub |
| ON | ON | OFF | valid | valid | provider_live_checkout |
| ON | ON | ON | valid | valid | provider_live_checkout + webhook ingress |

## Config

| Env | Required | Purpose |
|-----|----------|---------|
| `ENABLE_STRIPE_BILLING_PROVIDER` | Yes (to enable) | `true` / `1` / `yes` |
| `ENABLE_STRIPE_LIVE_CHECKOUT` | Yes (for live) | `true` / `1` / `yes` — default OFF |
| `ENABLE_STRIPE_WEBHOOK_INGRESS` | Yes (for webhook) | `true` / `1` / `yes` — default OFF |
| `STRIPE_SECRET_KEY` | Yes (when enabled) | Must start with `sk_` |
| `STRIPE_WEBHOOK_SECRET` | Yes (when enabled) | Must start with `whsec_` |
| `STRIPE_PRICE_{PLAN}_{CYCLE}` | Yes (for live) | e.g. `STRIPE_PRICE_TEAM_CONTRACTOR_MONTHLY` |

## Price mapping

- `getStripePriceId(planCode, billingCycle)` — from env
- `validateStripePriceMapping(planCode, billingCycle)` — for live checkout
- Missing mapping → controlled error, no live checkout

## Checkout mode

- **provider_ready_stub:** Live off. No Stripe API call. No redirect.
- **provider_live_checkout:** Live on. Real `checkout.sessions.create`. Returns redirectUrl, providerSessionRef.
- **provider_disabled_fallback:** Config invalid, price missing, or Stripe error.

## Session persistence

- Local session created first (billing_readiness_checkout_sessions).
- After Stripe session created: `provider_session_ref` updated with Stripe `cs_` id.
- Status → `pending_redirect` when redirect URL returned.
- Lookup: `getBillingCheckoutSessionByProviderRef` for webhook/event path.

## Return / cancel boundary

- **Success:** `/billing/return` — "Checkout initiated / awaiting confirmation". No immediate entitlement.
- **Cancel:** `/billing/cancel` — "Checkout cancelled".
- Success redirect ≠ subscription activation. Activation via webhook/event processor.

## Event translation

Stripe adapter `translateProviderEvent` maps checkout.session.completed, etc. to canonical shape.
Reconciliation uses `resolveCheckoutSession` (by id or provider_session_ref).

## Webhook ingress (Step 17, Step 18)

- **Endpoint:** `POST /api/v1/billing/webhooks/stripe`
- **Verification:** Stripe signature verification via `stripe.webhooks.constructEvent` (raw body + webhook secret)
- **Flow:** receive → verify → record (billing_readiness_events) → resolve workspace pilot eligibility → process only if eligible; else skip (no mutation)
- **Event types:** checkout.session.completed, checkout.session.expired, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted
- **Idempotency:** `getBillingEventByProviderRef` + unique index on (billing_provider, provider_event_ref)
- **Controlled:** Webhook ingress OFF by default. Requires `ENABLE_STRIPE_WEBHOOK_INGRESS=true` + valid config.
- **Step 18:** Webhook processing additionally gated by workspace pilot eligibility. Events for non-pilot workspaces are recorded but not processed (skipped_pilot_not_eligible or skipped_missing_workspace).

## Safety

- Live checkout OFF by default.
- Webhook ingress OFF by default.
- **Workspace pilot eligibility** required for live checkout and webhook processing. No global rollout.
- No paywall. No access gating changes.
- Sandbox remains default for workspaces outside pilot cohort.
