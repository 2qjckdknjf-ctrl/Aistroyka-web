# Project Maturity Assessment

**Scale:** Prototype → Early MVP → Functional MVP → Pre-Production → Production Ready.

---

## 1. Assessment: **Functional MVP** (leaning Pre-Production)

**Reasoning:**

- **Working:** Auth, tenant context, core v1 API (health, config, projects, AI analyze-image, jobs process, sync, media upload-sessions, worker endpoints, devices, tenant invite/members). Database migrations and RLS in place. Job queue and handlers work. Web dashboard with projects and AI features. Cloudflare + OpenNext build and deploy configured.
- **Gaps:** AI governance path bypassed (direct OpenAI in route and runVisionAnalysis). Lite client allow-list not enforced. Some business logic and direct DB access in routes (sync/bootstrap). Admin/billing/SCIM partially implemented or stubbed. Root app/ and engine/ separation unclear. No single AIService facade.
- **Production readiness:** Security and tenant isolation are in good shape; main gaps are architectural (AI path, route purity) and policy (lite allow-list, idempotency). Test coverage exists (unit + e2e smoke) but not full regression. Deployment and env documented; dry-run and cron strategy need to be explicit.

---

## 2. Dimension Summary

| Dimension | Level | Notes |
|-----------|--------|--------|
| Core backend | Functional MVP | Tenant, auth, projects, worker, sync, jobs, media work. |
| API design | Functional MVP | v1 present; legacy and v1 coexist; contracts and OpenAPI. |
| AI pipeline | Early MVP / Functional | Works end-to-end; governance and multi-provider not wired. |
| Mobile readiness | Early MVP | Worker/sync/upload ready; lite rules and idempotency not enforced. |
| Security | Pre-Production | Tenant isolation, RLS, headers; admin and diag to harden. |
| Observability | Functional MVP | Logging, metrics, audit; traceId/tenantId in context. |
| Testing | Early MVP / Functional | Unit tests on key services; e2e smoke; not full coverage. |
| Documentation | Pre-Production | ADRs, API docs, runbooks, status docs present. |
| Infrastructure | Functional MVP | Build and deploy defined; cron and dry-run to clarify. |

---

## 3. Why Not “Production Ready”

- AI calls do not go through Policy Engine and Provider Router (guardrail violation).
- Lite clients are not restricted to allowed paths.
- Route layer still contains business logic and direct DB in at least one endpoint (bootstrap).
- Admin and billing flows partially implemented or optional.
- Migration numbering has duplicates; deployment and rollback procedure to be confirmed.

---

## 4. Why Not “Early MVP” or “Prototype”

- Substantial surface: many v1 routes, domain services, platform modules, migrations, RLS.
- Tenant isolation and auth are consistently applied.
- Real integrations: Supabase, OpenAI, Stripe (optional), Cloudflare Workers.
- Documented architecture and ADRs; intentional design beyond a throwaway prototype.

---

## 5. Conclusion

The project is a **Functional MVP** with clear paths to **Pre-Production**: fix AI governance path, enforce lite allow-list, refactor route logic into services, and tighten admin/diag and deployment verification. After those, and with regression and runbook verification, it can be treated as **Pre-Production** and then **Production Ready** with operational hardening.
