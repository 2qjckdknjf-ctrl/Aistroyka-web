# Regional Pricing

**Phase 10 — Market Expansion & Revenue Scaling**  
**Regional tiers, currency, and deal structures.**

---

## Regional tiers

- **Base tiers:** Free, Pro, Enterprise (same feature set as PRICING_AND_PACKAGING). Limits (projects, workers, storage, AI budget) per tier unchanged; only price and currency vary by region.
- **Regions:** Home (e.g. RU/CIS); EU; NA (US/CA); LATAM; APAC. Define list in MARKET_EXPANSION_STRATEGY; pricing follows entry order.
- **Display:** Show price in local currency when possible; fallback to USD or EUR. Document which region sees which currency in config or docs.

---

## Currency strategy

- **Primary listing:** USD or EUR for B2B SaaS; second currency (e.g. RUB, BRL) where local payment and compliance require it.
- **Stripe (or processor):** Charge in customer currency if supported; or charge in USD/EUR and let card issuer convert. Document in REVENUE_OPERATIONS.
- **Invoicing:** Invoice in agreed currency (customer or contract); VAT/tax per country. See legal and REVENUE_OPERATIONS.

---

## Purchasing power adjustment

- **Optional:** In price-sensitive regions (e.g. LATAM, some CIS), offer same tier at lower local price (e.g. 20–30% discount) to improve conversion. Document as “regional adjustment” and review annually.
- **No separate product:** Same product and limits; only price differs. Avoid complex “regional tiers” that fragment SKUs.
- **Transparency:** Price list by region (internal); public pricing page can show “From $X” or “Contact for local pricing” where needed.

---

## Partner discounts

- **Referral:** Customer pays standard price; partner gets revenue share (no discount to customer unless we fund trial).
- **Reseller:** Reseller gets margin (e.g. 20–30% off list); reseller may add margin for end customer. We invoice reseller or customer per agreement.
- **SI/Implementation:** Customer may get pilot or first-year discount if SI brings deal; document in partner agreement.
- **Volume:** Multi-seat or multi-tenant deal discount (e.g. 10+ Pro seats) per REVENUE_OPERATIONS.

---

## Enterprise deal structures

- **Custom contract:** Annual or multi-year; custom limits (projects, workers, storage, AI); SSO, SLA, or data residency as add-ons. Price negotiated.
- **Minimum:** e.g. $X/year or Y seats; document in sales playbook.
- **Payment:** Annual prepay preferred; quarterly or monthly for large deals if needed. Invoicing and payment terms in REVENUE_OPERATIONS.
- **Renewal:** Auto-renew or renewal quote 90 days before end; price protection or escalation cap in contract.
