# Phase 12 — Packaging and pricing (customer-safe)

**Status:** Phase 12 roadmap deliverable. Aligns public positioning with the canonical plan-fit model and customer finance isolation rules.

## Goal

Make the product **sellable**: clear plans, honest limits, marketing copy that never implies owners see internal contractor financials.

## Marketing plan names vs product codes

Public names follow the mega-roadmap (Starter / Pro / Business / Enterprise). In code, entitlements use **PlanCode** (`packages/contracts`), and billing still uses a **legacy tier** (`FREE` | `PRO` | `ENTERPRISE`) bridged in `apps/web/lib/platform/plan-fit/bridge.ts`.

| Public name   | Canonical `PlanCode`      | Legacy tier (today) | Notes |
|---------------|---------------------------|---------------------|--------|
| Starter       | `client_personal`         | `FREE`              | Small / light footprint; bridged as minimal plan. |
| Pro           | `team_contractor`         | `PRO`               | Field execution, core commercial workflows internally. |
| Business      | `business_operations`     | *Not a distinct Stripe tier yet* | Product model exists; rollout = new paid SKU or tier split + webhook mapping (see implementation doc). |
| Enterprise    | `enterprise`              | `ENTERPRISE`        | SSO, audit, SLAs — state only what is released; remainder sales-scoped. |

Until **Business** has its own billing target, tenants on `PRO` + overrides or `ENTERPRISE` may approximate it operationally; do not claim SKU parity in marketing without engineering sign-off.

## Feature mapping (roadmap § Phase 12)

High-level alignment (details in `entitlements-config.ts`):

- **Starter:** limited projects/users, reports and photos, basic proof-oriented sharing, owner portal surfaces that respect isolation, estimate **approval** flows (customer sees proposals, not internal cost breakdowns).
- **Pro:** documents, internal cost modeling **for the contractor**, decision requests, customer-facing estimates and change orders, AI daily digest where shipped.
- **Business:** advanced permissions/branding as implemented, Telegram and similar integrations, handover-oriented packs, richer internal analytics — gated by capabilities in config.
- **Enterprise:** SSO, extended audit, retention posture, integrations package, dedicated support — **only advertise after release** or qualify as “contact us / scoped rollout”.

## Customer-safe value language

Use owner/customer-facing copy that describes **their** outcomes, not internal P&L:

- Estimate **review and approval**, transparent **progress**, **proof of completed work**, **decisions in one place**, **shared documents**.
- Do **not** promise owners visibility into internal margin, subcontractor rates, internal budget pressure, or raw cost items unless explicitly a customer-facing commercial artifact (approved estimate line items, agreed change orders) per isolation docs.

## Pricing page

- **Location:** `apps/web/app/[locale]/(public)/pricing/page.tsx` plus `public.pricing` in message files (`en`, `ru`, `es`, `it`).
- **Rule:** Four tiles (Starter, Pro, Business, Enterprise), CTAs to contact/demo; no fabricated list prices unless finance approves numbers.

## Honesty and “no fake enterprise”

- Do not claim unlimited projects, SSO, or bank-grade audit unless the build and ops posture match.
- Prefer “Contact us for Enterprise” with bullet **intent** over hard guarantees that are not in production.

## Related documentation

- `docs/product/PHASE12_PLAN_LIMITS_IMPLEMENTATION.md` — limits, enforcement, convergence of legacy tier vs PlanCode.
- `docs/architecture/PLAN_BRIDGE_AND_ENTITLEMENT_RESOLUTION.md` — bridge and add-ons.
- `docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md` — Phase 12 source requirements.
