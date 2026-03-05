# ADR-042: Stripe optional at runtime

**Status:** Accepted  
**Decision:** When STRIPE_SECRET_KEY (and STRIPE_WEBHOOK_SECRET for webhook) are not set, billing endpoints return "Billing not configured" or 400. Stripe package is dependency; instantiation only when key present. No feature flag for billing; env is the switch.

**Context:** Phase 5.2 safe rollout.
