# Cost Control and FinOps

**Phase 9 — Scale Infrastructure**  
**Financial scalability and optimization.**

---

## AI usage costs

- **Current:** Per-tenant monthly_ai_budget_usd (5 / 50 / 500); consumption tracked; request rejected (402) when over. No global AI spend cap or per-request cost logged in standard observability.
- **Track:** Aggregate AI cost (or units) per tenant and globally; store in usage table or export to billing. Alert when global monthly AI spend exceeds budget (e.g. $X).
- **Optimization:** Use cheaper model or smaller context where acceptable; cache or dedupe identical analyses; circuit breaker to avoid runaway retries. Document unit cost per provider/model for planning.
- **Recommendation:** Implement or export “AI cost per tenant per month” for billing and budget alerts; set global cap and alert threshold.

---

## Storage growth costs

- **Current:** storage_limit_gb per tenant (1 / 10 / 100); enforcement may be partial. Supabase (or provider) charges for storage and egress.
- **Track:** Storage used per tenant (sum of media/report assets); total DB size; total bucket size. Alert when total storage grows > X% month-over-month or exceeds $Y/month.
- **Optimization:** Retention enforcement (see DATA_AND_MEDIA_SCALING) to cap growth; CDN to reduce origin egress; tiering (hot/warm/cold) to lower unit cost for old data.
- **Recommendation:** Report storage usage per tenant; enforce limit at upload; run retention job; set budget alert for storage spend.

---

## Bandwidth costs

- **Current:** No in-repo bandwidth metering. Egress from Supabase and Cloudflare (or Vercel) is billed by provider.
- **Track:** Egress per tenant (if available from storage/CDN); total egress per month. Use provider billing or analytics.
- **Optimization:** CDN for media; compress responses where applicable; avoid large payloads. Document expected egress per active tenant for capacity planning.
- **Recommendation:** Enable egress reporting in provider; set alert when egress exceeds $X or 2× baseline.

---

## Compute usage

- **Current:** Cloudflare Workers: invocations and CPU time; no per-tenant compute metering in app.
- **Track:** Total invocations and CPU per day/month from Cloudflare dashboard; correlate with deploy and traffic growth.
- **Optimization:** Reduce cold starts; optimize hot path; avoid unnecessary work per request. WORKER_TIME_BUDGET_MS (25s) caps job processor run; ensure cron frequency and claim limit align with cost.
- **Recommendation:** Review Workers usage monthly; set budget or alert when compute cost exceeds threshold.

---

## Background job costs

- **Current:** Jobs run in same Worker (POST /api/v1/jobs/process) or cron; no separate worker fleet. Cost is part of compute and DB.
- **Track:** Job count per type per tenant; dead-letter count; processing time. High job volume or many dead letters increase DB and compute.
- **Optimization:** Tune backoff and max attempts to avoid thrash; fix or archive dead-letter jobs; consider separate job worker with different scaling if needed.
- **Recommendation:** Dashboard or query for job volume and dead-letter rate; alert on backlog or dead-letter spike.

---

## Budget thresholds

- **Global monthly:** Set cap for AI, storage, compute, and total platform. Alert at 80% and 100%.
- **Per tenant (optional):** Alert when a single tenant’s usage (AI or storage) exceeds $X or Y% of global; detect outlier or abuse.
- **Document:** Who sets budgets; review cadence (e.g. monthly); escalation when threshold hit (freeze, notify, or upgrade tenant).

---

## Cost alerts

- **Alerts:** 80% of monthly budget (warning); 100% (critical). Channel: email, Slack, or PagerDuty. Owner: FinOps or eng lead.
- **Runbook:** When alert fires: (1) Confirm spend in provider billing. (2) Identify top cost drivers (AI, storage, egress, compute). (3) Decide: increase budget, optimize, or throttle (e.g. rate limit or disable feature). (4) Document decision.

---

## Optimization levers

| Lever | Action |
|-------|--------|
| **AI** | Lower budget per tenant; use cheaper model; cache; circuit breaker. |
| **Storage** | Enforce retention; tier cold data; CDN to cut egress. |
| **Compute** | Optimize hot path; reduce cron frequency if safe; scale job worker if needed. |
| **Bandwidth** | CDN; compress; reduce payload size. |
| **DB** | Indexes; read replicas; connection pooling; archive old data. |

Document which levers are in place and which are planned; review quarterly.
