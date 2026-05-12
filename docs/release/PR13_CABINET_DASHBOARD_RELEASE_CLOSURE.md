# PR #13 — Cabinet / Dashboard Release Closure (Production)

**Date (UTC):** 2026-05-12  
**Role:** Principal release engineer checkpoint (merge + CF deploy + live smoke evidence).

---

## Summary

| Item | Value |
|------|--------|
| **PR** | [#13](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/13) — merged |
| **Pre-merge HEAD (cabinet commits on branch)** | `8529a91c04e6f6c504b41089240d85633824dacc` |
| **Merge commit (also `main` tip at merge)** | `d2360cbc3e1f8f7a3310b289db90369e5b91066a` |

---

## 1. Pre-merge safety

- **Mergeability:** MERGEABLE, merge state CLEAN (GitHub).
- **CI on pre-merge HEAD `8529a91c…`:** `check` (CI Check) **SUCCESS** run `25717893843`; **Workers Builds: aistroyka-web-production** **SUCCESS**.
- **Conflicts:** None at merge time.

---

## 2. Merge outcome

| Field | SHA / status |
|--------|----------------|
| **Merge strategy** | Standard **merge commit** (`gh pr merge 13 --merge`) |
| **Merge commit OID** | `d2360cbc3e1f8f7a3310b289db90369e5b91066a` |
| **`main` HEAD after merge** | `d2360cbc3e1f8f7a3310b289db90369e5b91066a` |
| **PR state** | **MERGED** (2026-05-12T06:46:05Z, GitHub timestamp) |

---

## 3. Production deploy workflow

| Field | Value |
|--------|--------|
| **Workflow** | `.github/workflows/deploy-cloudflare-prod.yml` — *Deploy Cloudflare (Production)* |
| **Trigger** | `push` to `main` after merge |
| **Run ID** | `25718254206` |
| **URL** | https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/25718254206 |
| **Conclusion** | **success** |
| **`headSha` (deployed)** | `d2360cbc3e1f8f7a3310b289db90369e5b91066a` |
| **Jobs** | Build and deploy → **success**; post-deploy pilot smoke → **success** |

---

## 4. Live smoke — `https://aistroyka.ai`

Executed immediately after deploy (curl, HTTPS, UTC ~06:49).

| Check | Expected | Observed |
|--------|-----------|----------|
| `GET /api/v1/health` | HTTP 200, `ok: true`, `buildStamp` | **HTTP 200** JSON: `"ok":true`, `"buildStamp":{"sha7":"d2360cb","buildTime":"2026-05-12 06:46"}` (matches **`d2360cbc…`** deploy) |
| `GET /dashboard` (unauthenticated) | No 500; redirect toward locale dashboard | **HTTP 308** `Location: /en/dashboard` |
| `GET /en/dashboard` (unauthenticated) | Redirect to login with `next=` | **HTTP 307** `Location: /en/login?next=%2Fen%2Fdashboard` |
| `GET /ru/dashboard` (unauthenticated) | Redirect to localized login + `next` | **HTTP 307** `Location: /ru/login?next=%2Fru%2Fdashboard` |
| `GET /en/login` | 200 | **200** |
| `GET /ru/login` | 200 | **200** |
| Public cabinet entry in HTML | Link to dashboard locale path | `GET https://aistroyka.ai/en/platform` contains **`href="/en/dashboard"`** (next-intl resolves `href="/dashboard"` → locale prefix). |

### Authenticated / dashboard shell smoke

**Not executed in this automation** — no PILOT/STAGING credentials supplied in this session. Operators SHOULD run logged-in flows (cabinet renders, `/subscribe` only when gate legitimately denies) using internal creds / existing `tests/e2e` or `scripts/smoke/`.

---

## 5. Subscription gate evidence (operators)

Secrets are **not** read here. Confirmation steps for Ops:

| Item | Verification |
|------|----------------|
| **`SUBSCRIPTION_GATE_DASHBOARD` in Workers (production)** | Cloudflare Workers → Production env vars; semantics in `docs/ENVIRONMENT-VARIABLES.md` (`enforce` default vs `off`/`pilot`/`bypass`). |
| Eligible tenants (non-blind bypass) | **Active/trialing** Stripe status; **PRO/ENTERPRISE** tier; **billing pilot cohort** (`billing_pilot_workspaces` or **`BILLING_PILOT_WORKSPACE_IDS`**); or explicit non-prod bypass per policy — see `subscription-gate` + incident closure doc. |

**Do not** turn off production enforcement blanket without product sign-off.

---

## 6. Redirect matrix (production behavior post-PR)

| Scenario | Result |
|---------|--------|
| Unauth **`GET /dashboard`** | **308 → `/en/dashboard`** (canonical locale alias) |
| Unauth **`GET /en/dashboard`** | **307 → `/en/login?next=/en/dashboard`** (`X-Auth-Redirect: login`) |
| Unauth **`GET /ru/dashboard`** | **307 → `/ru/login?next=/ru/dashboard`** |
| Auth **`GET /{locale}/login`** without **`next`** | **`resolvePostAuthEntry` → `/{locale}/dashboard`** (no **`/subscribe`** fallback on auth pages) |
| Auth **`GET /{locale}/login?next=<safe>`** | Redirect to sanitized safe internal **`next`** |
| Dashboard — **billing / entitlement / pilot cohort** grants access (`hasDashboardAccess`) | Dashboard shell loads (gate permits) |
| Dashboard — enforced gate, tenant present, **no** dashboard access path | **`/{locale}/subscribe?dashboard_access=require_subscription`** |

---

## 7. Final verdict

| Gate | Status |
|------|--------|
| Merge | **CLOSED** — PR merged |
| Deploy | **CLOSED** — workflow `25718254206` success |
| Unauthenticated live smoke (`aistroyka.ai`) | **PASS** |
| Authenticated dashboard + gate spot-check | **PENDING OPERATOR / E2E** (not blocking code release; credential-bound) |

### Single-line verdict for cabinet routing / availability

**CLOSED** — production deploy at `d2360cbc…` matches health `buildStamp`; unauthenticated routes and cabinet entry link behave as intended. Remaining diligence: optionally run **logged-in** smoke on prod with pilot vs non-pilot accounts.
