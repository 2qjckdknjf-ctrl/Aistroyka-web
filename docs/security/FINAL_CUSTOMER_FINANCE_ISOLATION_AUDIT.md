# Final customer finance isolation audit (Phase 13)

**Roadmap:** Phase 13 — § 13.4 Customer finance isolation tests  
**Date:** 2026-05-07 (isolation matrix); **PR #13 pass:** 2026-05-08  
**Rule:** Owner / customer must never see internal financial state of the construction company (mega-roadmap).

## Required negative guarantees (mapping)

| Requirement | Implementation / test |
|-------------|-------------------------|
| Owner cannot access manager costs route | `GET/POST /api/v1/projects/:id/costs` return **403** when cost service denies (`Insufficient rights`). **Test:** `app/api/v1/projects/[id]/costs/route.test.ts` (stakeholder/portal-only context + mocked service). Domain: `cost.service.test.ts` (stakeholder `listCostItems`). |
| Owner cannot access project cost item list | Same boundary — `listCostItems` requires `canReadProjects` (internal). |
| Owner cannot see internal cost overrun / budget summary | Not returned on portal client view builders; manager digest only for internal digest. |
| Owner cannot see internal budget summary | Portal `ClientProjectView`; `client_show_budget_summary` is **high-level** only when explicitly configured — see Phase 0–5 security docs. |
| Owner cannot see AI internal finance risk | Owner digest built only from `ClientProjectView`; manager lines may mention “internal budget” **by design**. **Test:** `daily-digest.service.test.ts`. |
| Owner can see only estimates sent to owner | `customer-estimates` / portal shaping; see `customer-estimates.service.test.ts` and portal routes. |
| Share proof does not include internal finance | `getProofPackByToken` shape — e.g. `approved_commercial_changes`, no cost line items. **Test:** `share/proof/[token]/route.test.ts` + `proof-pack.service.test.ts` as applicable. |
| Owner digest excludes internal finance | **PASS** architecturally — `docs/security/PHASE7_DIGEST_FINANCE_ISOLATION_AUDIT.md`; tests in `daily-digest.service.test.ts`. |
| Customer-facing routes fail-closed on forbidden finance keys | `assertCustomerFinanceSafePayload` guard applied in `/api/v1/portal/projects/:id` and `/api/v1/share/proof/:token`; route tests assert **500** on forbidden payload keys. |

## Historical phase audits (context)

- `docs/security/PHASE7_DIGEST_FINANCE_ISOLATION_AUDIT.md`
- `docs/security/PHASE4_ESTIMATE_FINANCE_ISOLATION_AUDIT.md`
- `docs/security/PHASE5_CHANGE_ORDER_FINANCE_ISOLATION_AUDIT.md`
- `docs/product/PHASE6_SHARE_LINK_SECURITY.md`

## P0 / P1

- **P0:** None open from this isolation matrix for **covered** routes; any **new** API must add a deny test if it exposes totals, SKU costs, or margin.
- **P1:** Extend route-level tests for **every** `/api/v1/projects/:id/*` cost-adjacent path (commercial items, internal jobs) on a case-by-case basis.

## PR #13 static review (2026-05-08)

**Repeat sweep (merge-readiness):** targeted grep across `portal`, `share`, `client-portal`, `customer-estimates`, `proof-pack`, `digest`, `project-handover`, `telegram` showed no internal-finance field emissions in route/service code; only comments and test assertions that **forbid** those tokens.

- **Portal API surface** (`apps/web/app/api/v1/portal/**`): no matches for internal cost field patterns in route code (grep).
- **Telegram notifications** (`lib/platform/telegram/**`): copy intentionally “without cost/margin data” per `telegram-notifications.emit.ts`.
- **Client portal / proof-pack / handover domains:** no dangerous field tokens in customer-shaping layers beyond tests that assert negatives (digest, proof-pack).
- **Costs API:** `GET`/`POST` `/api/v1/projects/:id/costs` deny tests for portal/stakeholder context remain in `app/api/v1/projects/[id]/costs/route.test.ts`.

## Extended sweep (2026-05-07)

Repo-wide `apps/web` TypeScript grep for cost/finance tokens surfaced hits in **internal** surfaces (e.g. `ProjectCostsPanel`, `/api/v1/projects/:id/costs`, `change-orders` `internal_cost_item_id`, `cost-signals`, manager actions). Customer-facing shaping layers (`portal`, `share`, digest owner path, proof-pack, telegram emit) remain aligned with prior PASS; digest/proof tests continue to assert absence of internal finance phrases in owner-facing output.

## Live stakeholder sanity (2026-05-09)

**BLOCKED** — do **not** mark **PASS** until all steps below are satisfied.

1. **Account:** a real **`stakeholder`** user (invited client). **`SMOKE_*` / tenant `owner`** on staging returns `role: owner` from `GET /api/v1/me` and does **not** substitute a portal-only check.
2. **Portal API deploy:** on **staging** and **production**, an authenticated `GET /api/v1/portal/projects` currently returns **HTML 404** (Next not-found page), while `GET /api/v1/projects` and owner `GET /api/v1/projects/:id/costs` return **200**. So `app/api/v1/portal/**` routes are **missing on the deployed Worker bundle** or the deploy is **stale** — **redeploy** the current OpenNext/Cloudflare build and re-check until `/api/v1/portal/projects` returns **200 JSON**.
3. **After deploy + credentials:** run `bash scripts/verify/stakeholder_finance_sanity.sh` with `STAKEHOLDER_SMOKE_EMAIL`, `STAKEHOLDER_SMOKE_PASSWORD` (optional `STAKEHOLDER_FINANCE_BASE_URL` — see `apps/web/.env.local.example`). Expect: `role=stakeholder`, `portal/projects` **200** JSON, `GET/POST .../costs` → **403**, portal project JSON must not expose internal cost keys.

**Repo/route tests** for cost isolation: **PASS**. **Live** stakeholder sanity: **BLOCKED** until steps 2–3.

**PASS (with continuous regression discipline)** — code-level boundaries and tests hold; **live** stakeholder verification follows the checklist above.
