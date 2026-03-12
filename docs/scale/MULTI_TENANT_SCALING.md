# Multi-Tenant Scaling

**Phase 9 — Scale Infrastructure**  
**Tenant isolation and fairness at scale.**

---

## Tenant quotas

- **Current:** Per-tenant limits from subscription (max_projects, max_workers, storage_limit_gb, monthly_ai_budget_usd). Enforced at create/invite and at AI call; storage enforcement may be partial.
- **Recommendation:** Enforce all limits at API and job layer: reject create project when at max_projects; reject invite worker when at max_workers; block upload when storage usage ≥ storage_limit_gb; block AI when budget exceeded. Expose usage (e.g. current storage, current AI spend) via API or admin so tenant can see headroom.
- **Document:** Quota matrix (limit name, per tier, where enforced) in PRICING_AND_PACKAGING or here.

---

## Rate limiting by tenant

- **Current:** checkRateLimit(supabase, { tenantId, ip, endpoint }) with per-tenant and per-IP limits from subscription (per_minute_rate_limit_tenant, per_minute_rate_limit_ip). Applied to HIGH_RISK_ENDPOINTS (AI, report submit, jobs/process, login) and to sync and upload-sessions.
- **Recommendation:** Keep per-tenant and per-IP limits; add rate limiting to other write-heavy routes (task assign, report review, invite) if needed to prevent single-tenant burst from affecting others. Document which routes are limited and at what values per tier.
- **Fail-open:** When rate limit store (Supabase) is unavailable, routes currently allow request and log rate_limit_unavailable. For login, consider fail-closed (reject) to reduce credential stuffing when store is down.

---

## Noisy neighbor mitigation

- **Job concurrency:** One concurrent job per tenant (try_acquire_job_slot). Prevents one tenant’s long-running jobs from monopolizing the worker. Slot is released after each job completes or fails.
- **Rate limit:** Per-tenant cap prevents one tenant from consuming all API capacity.
- **DB:** No per-tenant connection pool in repo; all tenants share pool. At very high concurrency, consider connection limits per tenant or query timeouts. Advanced: read replicas and route read-only queries to replicas.
- **AI:** Circuit breaker is global per provider; one tenant’s provider failure can open circuit for all. Per-tenant circuit or fallback is future option; document current behavior.

---

## Billing usage metrics

- **Track:** Per tenant_id: AI usage (cost or units), storage (bytes or GB), request count (optional), job count (optional). Store in DB or export to billing system.
- **Current:** AI budget and consumption tracked for 402; storage limit exists; no centralized “usage record” table for all dimensions.
- **Recommendation:** Emit or write usage events (tenant_id, dimension, quantity, period) for AI, storage, and optionally requests; aggregate for billing and quota. Align with PRICING_AND_PACKAGING overage or caps.
- **Access:** Only org admin or billing system; never expose other tenants’ usage.

---

## Resource partitioning strategy

- **Current:** Logical partitioning only: all data scoped by tenant_id; RLS and app layer enforce. No physical partitioning (separate DB or shard per tenant) in repo.
- **Scale path:**  
  - **Phase 1 (current):** Single DB; tenant_id on every table; indexes on tenant_id; rate limit and job slot per tenant.  
  - **Phase 2:** Add read replicas; route read-heavy queries to replica; keep writes on primary.  
  - **Phase 3 (if needed):** Tenant sharding (e.g. tenant_id → shard) for very large tenants or total tenant count; requires routing layer and migration.  
- **Document:** We are in Phase 1; Phase 2 and 3 are options when metrics justify (e.g. DB CPU > 70%, or tenant count > N).
