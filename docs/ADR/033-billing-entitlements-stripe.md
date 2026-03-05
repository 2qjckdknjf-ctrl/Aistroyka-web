# ADR-033: Billing integration (Stripe) and entitlements as source of truth

**Status:** Accepted  
**Decision:** Billing tables: billing_customers (tenant_id, stripe_*, plan, status, period), entitlements (tenant_id, tier, ai_budget_usd, max_projects, max_workers, storage_limit_gb). Entitlements is the single source of truth for limits; subscription.service reads from entitlements first, then tenants.plan. Stripe: checkout session, portal session, webhook (signature verified) update billing_customers and entitlements. When STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET not set, billing endpoints return "not configured". Permission billing:admin (owner only). Audited.

**Context:** Phase 5.2; real SaaS monetization.

**Consequences:** Tier and limits come from entitlements when present; webhook keeps them in sync with Stripe. Stripe dependency added; optional at runtime when keys unset.
