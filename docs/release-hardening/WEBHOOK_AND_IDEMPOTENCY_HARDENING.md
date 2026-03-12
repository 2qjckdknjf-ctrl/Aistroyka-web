# Webhook and idempotency hardening

## Billing webhook (Stripe)

- **Signature:** Verified via Stripe webhook secret; invalid signature → 400.
- **Idempotency:** Processed event ids stored in **processed_stripe_events** (event_id primary key). On receipt:
  1. Verify signature.
  2. Check if event.id exists in processed_stripe_events; if yes → return 200 { received: true }.
  3. Insert event.id; on conflict (23505) → return 200 { received: true }.
  4. Process event (checkout.session.completed, customer.subscription.updated/created); then return 200.

So duplicate Stripe retries do not double-apply subscription or checkout updates.

## Migration

- **20260306900000_stripe_webhook_idempotency.sql** — creates processed_stripe_events; RLS allows only service_role.

## Other endpoints

- **jobs/process:** Tenant-scoped; rate-limited; idempotency via job dedupe_key where used.
- **Lite client:** x-idempotency-key supported for worker flows (idempotency_keys table, tenant-scoped).
- **Cron-tick:** No idempotency needed (idempotent by design: enqueue + process).

## Operational risk

- **DB constraint:** processed_stripe_events primary key prevents duplicate insert; select-then-insert race is handled by insert conflict.
- **What is protected:** Stripe subscription and checkout handling. Other externally-triggered endpoints (e.g. SCIM) should be reviewed for replay safety if added.
