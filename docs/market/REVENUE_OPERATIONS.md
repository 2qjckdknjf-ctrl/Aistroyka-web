# Revenue Operations

**Phase 10 — Market Expansion & Revenue Scaling**  
**Subscription lifecycle, billing, renewal, churn, upsell.**

---

## Subscription lifecycle

1. **Acquisition:** Lead → MQL → SQL → Opportunity (pilot or direct sign-up).
2. **Activation:** First login; first task assigned; first report submitted (see GROWTH_KPI_FRAMEWORK).
3. **Conversion:** Pilot or trial → paid (Pro/Enterprise); or Free → Pro when limits hit.
4. **Renewal:** Contract end; renewal quote or auto-renew; expand or downgrade.
5. **Churn:** Cancellation or non-renewal; exit survey and reason code; win-back if appropriate.

**Ownership:** Sales for acquisition and enterprise; CS for activation and renewal; Ops for billing and invoicing.

---

## Billing flows

- **Self-serve (Stripe):** Customer adds payment method; we charge on subscribe (monthly or annual). Webhook for payment success/failure; retry and dunning per Stripe or config.
- **Sales-led (invoice):** Customer receives quote; signs; we create subscription in Stripe (or invoice outside Stripe). Payment terms (e.g. Net 30); reminder before due.
- **Upgrade/downgrade:** Proration or immediate change; document in Stripe or billing logic. Downgrade at period end to avoid complexity.
- **Tax:** Stripe Tax or manual; VAT/GST by country. Invoice line items and tax in REVENUE_OPERATIONS and legal.

---

## Invoicing

- **Who:** Issued by legal entity per region (or single entity with VAT registration where required).
- **Content:** Company and customer details; subscription description; amount; tax; payment terms; bank or payment link.
- **Frequency:** Monthly or annual per plan; one-off for setup or add-ons if any.
- **Delivery:** Email PDF; optional customer portal to download. Retain for audit (7 years or per jurisdiction).

---

## Renewal strategy

- **Timing:** Renewal quote or reminder 90 days before end; follow-up at 60 and 30 days. Auto-renew if contract allows; else require explicit renewal.
- **Upsell:** At renewal, offer seat expansion or tier upgrade if usage supports it (see upsell triggers).
- **Price change:** Communicate 60+ days ahead; honor existing price for current term; new price at renewal. Document in terms.
- **Owner:** CS or account manager; renewal rate target (e.g. 85%+) in EXPANSION_ANALYTICS.

---

## Churn mitigation

- **Early warning:** Usage drop (logins, reports, tasks); support tickets; payment failure. Alert CS for at-risk accounts.
- **Outreach:** Check-in call or email; offer help or training; address pain (feature, price, support).
- **Exit survey:** Reason (price, missing feature, switched vendor, other); free text. Use for product and pricing.
- **Win-back:** Optional offer (discount or trial) for churned within 90 days; track in EXPANSION_ANALYTICS.

---

## Upsell triggers

- **Usage-based:** Nearing project, worker, or storage limit → prompt to upgrade or add seats.
- **Role-based:** Viewer or member wants to assign tasks or review → suggest Pro/Enterprise.
- **Time-based:** At renewal; or 90 days after pilot conversion (“You’ve been on Pro for 90 days; here’s what Enterprise adds”).
- **Event-based:** Large deal or partner referral → offer multi-seat or enterprise from start.
- **In-app and email:** In-app banner or email when trigger fires; link to pricing or “Contact sales.”
