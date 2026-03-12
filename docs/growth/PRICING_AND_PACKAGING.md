# Pricing and Packaging

**Phase 8 — Pilot Rollout & Growth**  
**SaaS structure for Free, Pro, and Enterprise.**

---

## Tiers (aligned with platform limits)

| Tier | Target | Monthly AI budget (USD) | Rate limit (tenant/min) | Rate limit (IP/min) | Max projects | Max workers | Storage |
|------|--------|--------------------------|---------------------------|----------------------|--------------|-------------|---------|
| **Free** | Try / small team | 5 | 10 | 5 | 3 | 2 | 1 GB |
| **Pro** | Growing team | 50 | 60 | 20 | 20 | 15 | 10 GB |
| **Enterprise** | Large / custom | 500 | 300 | 60 | 500 | 200 | 100 GB |

*Source: `lib/platform/subscription/limits.ts` (FREE, PRO, ENTERPRISE).*

---

## Feature gating

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Tasks & reports | ✓ | ✓ | ✓ |
| Manager review workflow | ✓ | ✓ | ✓ |
| AI analysis (image, summary) | ✓ (within budget) | ✓ | ✓ |
| Push notifications | ✓ | ✓ | ✓ |
| Admin panel (AI, jobs, SLO, audit) | ✓ | ✓ | ✓ |
| Multiple projects | Up to 3 | Up to 20 | Up to 500 |
| Team size (workers) | Up to 2 | Up to 15 | Up to 200 |
| Storage | 1 GB | 10 GB | 100 GB |
| Priority support | — | Optional add-on | ✓ |
| SSO / SAML | — | — | Optional |
| Custom retention / SLA | — | — | Optional |

**Enforcement:** Backend checks subscription tier and limits (projects, workers, storage, rate limit, AI budget); returns 402 or 403 when exceeded. No domain model change; gating is limit-based.

---

## Usage limits

- **AI usage:** Monthly budget per tenant (USD); consumption tracked; when exceeded, AI endpoints return 402 or quota error. Reset monthly or by billing cycle.
- **Rate limit:** Per-tenant and per-IP per minute (see limits table); 429 when exceeded.
- **Projects / workers / storage:** Hard caps per tier; create project or invite worker fails with clear error when at cap.
- **Exports / audit:** Optional gating by tier (e.g. audit export only Pro+); document in feature matrix.

---

## AI usage pricing (reference)

- **Pilot:** Often included in pilot discount (see below); budget still enforced to avoid abuse.
- **Post-pilot:** Price per unit of AI usage (e.g. per image analysis, per 1k tokens) or bundled in Pro/Enterprise monthly price. Exact pricing is product decision; document here when set.
- **Overage:** Option: block when budget exceeded; or overage price per unit. Prefer block for pilot.

---

## Storage pricing (reference)

- **Included:** Per tier (1 / 10 / 100 GB). Media and report assets count toward storage.
- **Overage:** Option: block uploads when at cap; or overage per GB. Prefer block for pilot.
- **Document:** Where storage is metered (e.g. Supabase storage bucket per tenant or total).

---

## Pilot discounts

- **Pilot tier:** Free or discounted Pro for pilot duration (e.g. 4–8 weeks). Same limits as Free (or Pro if agreed) to avoid surprise at conversion.
- **Terms:** Pilot is time-bound; at end, convert to Free (self-serve) or Pro/Enterprise (paid). Document in pilot agreement.
- **No long-term discount without contract:** Post-pilot list price unless Enterprise agreement.

---

## Summary

- **Free:** Full product with low limits; suitable for trial and very small team.
- **Pro:** Mid limits; suitable for growth; optional priority support.
- **Enterprise:** High limits; optional SSO, custom retention, SLA; sales-led.
- **Pilot:** Free or discounted Pro for pilot period; limits and feature set documented and enforced.
