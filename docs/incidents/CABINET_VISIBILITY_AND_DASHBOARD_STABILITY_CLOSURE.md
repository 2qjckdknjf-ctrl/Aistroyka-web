# Incident closure: cabinet visibility and dashboard stability

**Scope:** Web app only (`apps/web`). No mobile changes.

**Implementation commit (routing/gate/tests):** `bac6079853c826a1c8a202875a09735b5db6840b`  
**Documentation tip (this closure report / CI re-run):** `999891d7` on branch `chore/deep-production-completion` (docs-only delta after implementation).

---

## What was broken

1. **Public entry to the cabinet:** Marketing users could not reliably discover the dashboard from the public shell; the cabinet needed an explicit CTA with stable routing into the dashboard locale tree.
2. **Post-auth routing:** Authenticated visits to `/login` or `/register` could fall through to unwanted destinations (historically perceived as `/subscribe`-first), so the cabinet looked “gone” after sign-in when `next` was absent.
3. **Subscription gate vs pilots:** With `SUBSCRIPTION_GATE_DASHBOARD` enforced, pilot cohort tenants without a paid Stripe row could be bounced from dashboard to `/subscribe`.
4. **Proof of routing:** Policy tests and curl smoke existed locally; merge gate additionally needed lint, tests, and Cloudflare/OpenNext bundle on the same HEAD.

---

## What was fixed (closure checklist)

### PublicHeader

- **Desktop:** explicit **`/dashboard`** CTA (locale via i18n `Link`): `href="/dashboard"`, copy `public.nav.cabinet` (ru/en/es/it).
- **Mobile:** same CTA inside the collapsible nav.

### Middleware

- **`isAuthPage && user`:** redirect target is **`resolvePostAuthEntry({ locale, next, baseUrl: request.url })` only**.
- **`next` absent or unsafe:** resolves to **`/{locale}/dashboard`** (no **`/subscribe`** fallback on auth pages).
- **Response diagnostic:** **`X-Auth-Redirect: post-auth-entry`** on that redirect branch.
- **Guests:** protected routes (`/dashboard`, `/portal`, …) → **`/{locale}/login?next=<pathname>`** (preserves localized path).

### Subscription gate

- **`getActiveSubscriptionStateForUser`** returns **`hasDashboardAccess`** = subscribed/trialing/paid-tier **OR** billing pilot cohort (`billing_pilot_workspaces` **or** **`BILLING_PILOT_WORKSPACE_IDS`**).
- **`SUBSCRIPTION_GATE_DASHBOARD`** still supports **`off` / `pilot` / `bypass`** to disable the layout redirect wholesale (staging/operators).
- **`(dashboard)/layout`:** redirects to **`/subscribe?dashboard_access=require_subscription`** only when gate enforced **and** **`tenantId`** present **and** **`!hasDashboardAccess`**.
- **`/subscribe`:** redirects to dashboard when **`tenantId && hasDashboardAccess`**.
- **Blocked UX:** localized **`dashboardAccessNotice`** when **`dashboard_access=require_subscription`**.

### Tests / smoke / docs

- Policy tests (`cabinet-dashboard-routing.policy.test.ts`), **`subscription-gate`** tests; **`scripts/smoke/dashboard_cabinet_smoke.sh`** + manual checklist comments.
- **`docs/ENVIRONMENT-VARIABLES.md`:** billing gate + pilot cohort behavior.

---

## Redirect matrix (authoritative narrative)

Canonical flows after this closure:

| Flow | Behavior |
|------|-----------|
| **Unauthenticated `/dashboard`** | Middleware issues **308** to **`/en/dashboard`** (apex alias). Then **`/en/dashboard`** is protected → **`/en/login?next=/en/dashboard`**. |
| **Unauthenticated localized dashboard** | **`/{locale}/dashboard`** → **`/{locale}/login?next=/{locale}/dashboard`** (middleware `pathnameForLoc` preserved). |
| **Authenticated `/login` without `next`** | **`resolvePostAuthEntry`** → **`/{locale}/dashboard`**. |
| **Authenticated `/login` with safe `next`** | Sanitized **`next`** (same-origin, allowed prefixes) → that path (**`explicit_next`**). |
| **Dashboard, gate enforced, no billing, pilot cohort** | **`hasDashboardAccess` true** → **no** redirect to **`/subscribe`**. |
| **Dashboard, gate enforced, tenant, no billing, not pilot/bypass/trial/active** | Redirect **`/{locale}/subscribe?dashboard_access=require_subscription`**. |

---

## Redirect matrix (before → after, summary)

| User / route | Before (problem state) | After (closed behavior) |
|--------------|------------------------|--------------------------|
| Guest `GET /{locale}/dashboard` | Login + `next` expected | **`/{locale}/login?next=<path>`** |
| Auth `GET /{locale}/login` (no `next`) | Risk of **`/subscribe`‑style sink | **`resolvePostAuthEntry` → `/{locale}/dashboard`** |
| Auth with safe **`next`** | Variable | Resolved safe internal path |
| Tenant, enforced, pilot cohort DB/env | Often treated unpaid → **`/subscribe`** | **`hasDashboardAccess`** → dashboard |
| Tenant + **`SUBSCRIPTION_GATE_DASHBOARD=off|pilot|bypass`** | Gate off | Layout does not redirect to subscribe |

---

## CI evidence (merge gate — implementation SHA `bac60798…`)

Evidence below was recorded when **PR #13** HEAD matched **`bac6079853c826a1c8a202875a09735b5db6840b`** (routing/gate/tests). A follow-up **documentation-only** commit may re-trigger the same workflow on a new SHA without changing product code.

| Check | Result | Notes |
|-------|--------|--------|
| **GitHub Actions — workflow “CI Check” job `check`** | **PASS** | Lint + tests + build pipeline per `.github/workflows/ci-check.yml`; run **`25717427195`**, conclusion **`success`**. Link: https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/25717427195 |
| **Workers Builds — `Workers Builds: aistroyka-web-production`** | **PASS** | Cloudflare/OpenNext bundle gate for this PR HEAD. |

**Related (non-merge-gate deploy checks):** Vercel previews may finish independently (e.g. secondary project rows); cabinet closure is gated on **`check`** + **Workers Builds** above.

### Local parity (already run on closure branch)

From repo root: **`bun run lint`**, **`bun run test`**, **`bun run cf:build`** — all succeeded during development verification.

---

## Lightweight smoke script (operators)

```bash
BASE_URL=https://<staging-or-production> bash scripts/smoke/dashboard_cabinet_smoke.sh
```

Probes **`/dashboard`**, **`/ru/dashboard`**, **`/en/dashboard`**, **`/api/v1/health`**. Scripted checks do not carry Supabase cookies; full **public → `/dashboard` → login → localized dashboard** must be exercised in a browser once merged.

---

## Verdict

| Gate | Status |
|------|--------|
| **Implementation (code / tests)** | **CLOSED** — behavior and policy tests documented above |
| **CI on HEAD SHA** | **PASSED** — see table |
| **Production / staging proof** | **OPEN** — **remaining:** merge PR #13 (`chore/deep-production-completion`) + **operator Cloudflare live smoke** (URLs + checklist in smoke script comments) |

**Summary:** Repo and CI gates for this closure are satisfied at **`bac60798…`**; operational sign-off awaits merge and authenticated live smoke against the deployed Worker host.
