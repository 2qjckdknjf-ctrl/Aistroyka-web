# Billing Sandbox Flow (Step 13, Step 14)

**Purpose:** Internal simulation of checkout flow. No real payment. Admin/owner only.

## Flow

1. **Create checkout session** — `POST /api/v1/billing/checkout-readiness`
   - Validates plan and workspace
   - Creates `billing_readiness_checkout_sessions` record
   - Adapter (sandbox) returns `mode: sandbox_simulation`, no redirect URL

2. **Complete sandbox checkout** — `POST /api/v1/billing/sandbox/complete` (body: `{ sessionId }`)
   - Records event `sandbox.checkout.completed`
   - Runs event through **billing event processor** (Step 14)
   - Processor: translate → reconcile → session completed, subscription created if none
   - Requires `billing:admin` (owner)

3. **Cancel sandbox checkout** — `POST /api/v1/billing/sandbox/cancel` (body: `{ sessionId }`)
   - Records event `sandbox.checkout.cancelled`
   - Runs event through **billing event processor**
   - Processor: translate → reconcile → session cancelled, subscription unchanged
   - Requires `billing:admin` (owner)

## Event processing lifecycle (Step 14)

1. **Record** — Event written to `billing_readiness_events` with `processing_status: pending`
2. **Translate** — Adapter `translateProviderEvent` produces canonical `BillingTranslatedEvent`
3. **Process** — `processBillingEventRecord` applies reconciliation rules
4. **Mark** — Event `processing_status` updated to `processed` / `failed` / `skipped`

Sandbox and future provider use the same processor path.

## Reconciliation rules

| Event | Session | Subscription |
|-------|---------|--------------|
| Complete | status → completed | Create if none (active) |
| Cancel | status → cancelled | Unchanged |

## Event types

- `sandbox.checkout.completed` — checkout completed
- `sandbox.checkout.cancelled` — checkout cancelled
- `sandbox.subscription.activated` — (future) subscription activated
- `sandbox.subscription.cancelled` — (future) subscription cancelled

## Access

- Sandbox routes require tenant context + `billing:admin` (owner role)
- Session must belong to caller's workspace
- Not exposed as user-facing billing UI

## Separation preserved

- **Selected plan** — unchanged; from workspace_plan_state
- **Billing subscription** — readiness state only; no production enforcement
- **Effective entitlements** — still from plan-fit; no billing-based gating
