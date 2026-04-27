# Billing Pilot E2E Runbook (Step 20)

**Purpose:** Run a controlled end-to-end pilot billing scenario for an allowlisted workspace. No global rollout; no access enforcement based on billing.

**Prerequisite:** Workspace must be in pilot cohort. Internal admin only.

---

## 1. Prerequisites

### Flags and config

- `ENABLE_STRIPE_BILLING_PROVIDER` = true
- `ENABLE_STRIPE_LIVE_CHECKOUT` = true
- `ENABLE_STRIPE_WEBHOOK_INGRESS` = true
- `STRIPE_SECRET_KEY` (sk_…)
- `STRIPE_WEBHOOK_SECRET` (whsec_…)
- Price mapping: `STRIPE_PRICE_{PLAN}_{CYCLE}` (e.g. `STRIPE_PRICE_TEAM_CONTRACTOR_MONTHLY`)

### Pilot cohort

- Workspace ID in `billing_pilot_workspaces` (DB) or `BILLING_PILOT_WORKSPACE_IDS` (env)
- `live_checkout_enabled` and `webhook_processing_enabled` = true

### Webhook endpoint

- Stripe Dashboard: webhook endpoint pointing to `POST /api/v1/billing/webhooks/stripe`
- Events: `checkout.session.completed`, `checkout.session.expired`, `customer.subscription.created/updated/deleted`

---

## 2. How to start checkout for pilot workspace

1. User must have `billing:admin` in workspace.
2. From billing page (or plan selection), initiate checkout via:
   - `POST /api/v1/billing/checkout-readiness`
   - Body: `{ targetPlanCode, billingCycle, returnUrl, cancelUrl }`
   - Return URL: `{origin}/{locale}/billing/return`
   - Cancel URL: `{origin}/{locale}/billing/cancel`
3. Response includes `redirectUrl`. Redirect user to Stripe Checkout.

---

## 3. What operator should observe before redirect

- Internal admin: `GET /api/v1/admin/billing/workspace-status?workspaceId=…`
- `executionStatus.stage` should be `ready_for_checkout` or `checkout_created`
- `mode` = `provider_live` for live pilot; `sandbox` for sandbox workspace
- No `attentionReasons` if proceeding cleanly

---

## 4. What operator should observe after return

- User completes payment → Stripe redirects to return URL (`/billing/return`)
- User cancels → Stripe redirects to cancel URL (`/billing/cancel`)
- Return page: "Checkout initiated / awaiting confirmation" (no immediate entitlement)
- Activation happens via webhook, not return page

**Return/cancel tracking:** E2E status is derived from checkout session status (updated by webhook) and event processing. Return/cancel pages are UI-only; no additional tracking layer. The authoritative signal is `checkout.session.completed` or `checkout.session.expired` from the provider. If webhook is delayed, `executionStatus.stage` remains `awaiting_provider_completion` until timeout (15 min) when it becomes `pilot_needs_attention`.

---

## 5. What webhook event should arrive

- Event type: `checkout.session.completed`
- Stripe sends to `POST /api/v1/billing/webhooks/stripe`
- Ingress: verify signature → record event → resolve pilot → process if eligible

---

## 6. What processor outcome expected

- Event `processing_status` → `processed`
- Checkout session `status` → `completed`
- New row in `billing_readiness_subscriptions` with `status` = `active`
- `executionStatus.stage` → `subscription_state_updated` or `pilot_verified`

---

## 7. What overview/diagnostics should show

- `GET /api/v1/billing/overview` (user): `billingSubscription` with `status` = `active`
- `GET /api/v1/admin/billing/workspace-status?workspaceId=…`: `executionStatus.stage` = `pilot_verified`
- Event counts: processed increased; no failed
- `currentSubscription` present and active

---

## 8. What to do if event failed / pending

### Failed event

- `GET /api/v1/admin/billing/workspace-status` → `lastFailureReason`, `eventCounts.failed`
- `POST /api/v1/admin/billing/reprocess-event` with `{ eventId }`
- Or `POST /api/v1/admin/billing/reprocess-workspace-events` with `{ workspaceId, includeFailed: true }`
- Re-check diagnostics after reprocess

### Pending event

- `POST /api/v1/admin/billing/reprocess-workspace-events` with `{ workspaceId }`
- Or `POST /api/v1/admin/billing/process-pending-events` (global)

### Webhook not received

- If checkout created > 15 min ago and no webhook: `executionStatus.attentionReasons` includes `checkout_created_no_webhook_timeout`
- Check Stripe Dashboard: webhook delivery status, retries
- Verify webhook URL and secret; verify workspace in pilot cohort

---

## 9. Rollback / safe fallback steps

- **No destructive actions.** Do not delete subscriptions or checkout sessions manually.
- If pilot run fails: workspace remains in prior state (selected plan, no billing subscription, or existing subscription unchanged).
- To "undo" a successful pilot run: cancel subscription via provider (Stripe Dashboard) or future admin tooling. Event processor will handle `customer.subscription.deleted`.
- Sandbox workspace: use `POST /api/v1/billing/sandbox/complete` or `POST /api/v1/billing/sandbox/cancel` for simulation.

---

## 10. Explicit statement: no entitlement enforcement based on billing

**Pilot verified does NOT imply:**

- Access enforcement switched to billing
- Paywall enabled
- Entitlements derived from billing subscription for runtime checks

**Pilot verified means:**

- Workspace eligible
- Checkout session created in live mode
- Provider webhook received and processed
- Billing subscription status updated
- Diagnostics/overview consistent
- **No access enforcement changed**

---

## E2E stages reference

| Stage | Meaning |
|-------|---------|
| `pilot_not_eligible` | Workspace not in pilot cohort |
| `ready_for_checkout` | Eligible; no active checkout |
| `checkout_created` | Session created |
| `awaiting_provider_completion` | User at Stripe; no webhook yet |
| `webhook_received` | Event recorded |
| `event_processed` | Event processed |
| `subscription_state_updated` | Subscription active |
| `pilot_verified` | E2E verified |
| `pilot_needs_attention` | Failure, timeout, or inconsistency |
| `cancelled` | Checkout cancelled/expired |
| `failed` | Processing failed |
