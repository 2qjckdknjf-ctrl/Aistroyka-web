# Incident closure: cabinet visibility and dashboard stability

**Scope:** Web app only (`apps/web`). No mobile changes.

---

## What was broken

1. **Public entry to the cabinet:** Marketing users could not reliably discover the dashboard from the public shell; the cabinet needed an explicit CTA with stable routing to `/dashboard` (locale handled by i18n routing).
2. **Post-auth routing:** Authenticated visits to `/login` or `/register` could be steered toward `/subscribe` instead of the canonical post-auth resolver, so users perceived the cabinet as “gone” after signing in.
3. **Subscription gate vs pilots:** With `SUBSCRIPTION_GATE_DASHBOARD` enforced, tenants that were in a **billing pilot cohort** but had no paid Stripe row were redirected from the dashboard to `/subscribe`, which felt like losing the cabinet even when pilot access was intentional.
4. **Proof of routing:** CI was green but there was no lightweight, repo-local check for public → dashboard paths and health.

---

## What was fixed

| Area | Change |
|------|--------|
| **Public header** | Explicit cabinet CTA on desktop and mobile: `href="/dashboard"`, copy from `public.nav.cabinet` (ru/en/es/it). |
| **Middleware** | For `isAuthPage && user`, redirect target is **only** `resolvePostAuthEntry({ locale, next, baseUrl: request.url })`. Missing or invalid `next` resolves to `/{locale}/dashboard`. Response header `X-Auth-Redirect` is `post-auth-entry` for that branch. Guests on protected routes still get `/{locale}/login?next=<pathname>`. |
| **Subscription gate** | `getActiveSubscriptionStateForUser` exposes `hasDashboardAccess` = paid/trial billing **or** billing pilot cohort (`billing_pilot_workspaces` / `BILLING_PILOT_WORKSPACE_IDS`). `(dashboard)/layout` redirects to `/subscribe` only when gate is enforced **and** tenant exists **and** `!hasDashboardAccess`. `/subscribe` sends users with dashboard access back to the dashboard. |
| **UX when blocked** | `?dashboard_access=require_subscription` continues to surface `dashboardAccessNotice` on the subscribe onboarding screen (localized). |
| **Tests + smoke** | Policy tests (`cabinet-dashboard-routing.policy.test.ts`), `subscription-gate` tests, `entry-routing` tests; script `scripts/smoke/dashboard_cabinet_smoke.sh` plus embedded manual checklist. |
| **Docs** | `docs/ENVIRONMENT-VARIABLES.md` updated for gate + pilot cohort behavior. |

---

## Redirect matrix (before → after)

| User / route | Before (problem state) | After (closed behavior) |
|--------------|----------------------|--------------------------|
| Guest `GET /{locale}/dashboard` | Redirect login + `next` (unchanged expectation) | Same: `/{locale}/login?next=<path>` |
| Auth `GET /{locale}/login` (no `next`) | Fallback could send users to `/subscribe` | `resolvePostAuthEntry` → `/{locale}/dashboard` |
| Auth `GET /{locale}/login?next=/en/projects/…` | Variable | Same safe `next` when sanitized |
| Tenant, enforce gate, **no** billing **not** pilot | Redirect `/subscribe` | Same (by design) |
| Tenant, enforce gate, pilot cohort env/DB | Often treated like “no subscription” → subscribe | **`hasDashboardAccess` true** → stay in dashboard |
| Tenant + `SUBSCRIPTION_GATE_DASHBOARD=off|pilot|bypass` | No server redirect from layout | Same |

---

## Validation evidence

Commands run from repository root (`/Users/alex/Projects/AISTROYKA`), in order:

1. `bun run lint`
2. `bun run test`
3. `bun run cf:build`

### Results (2026-05-12, local)

- **Lint:** `bun run lint` — success (Next.js ESLint, no warnings).
- **Tests:** `bun run test` — success (266 files, 1414 tests, Vitest).
- **Cloudflare/OpenNext:** `bun run cf:build` — success (OpenNext bundle written to `apps/web/.open-next/worker.js`).

---

## Lightweight smoke script

```bash
BASE_URL=http://localhost:3000 bash scripts/smoke/dashboard_cabinet_smoke.sh
```

Covers HTTP probes: `/dashboard`, `/ru/dashboard`, `/en/dashboard`, `/api/v1/health`. The script comments list the manual **public → `/dashboard` → login → `/…/dashboard** checklist for environments where auth cookies are needed.

---

## Final verdict

**CLOSED.**

Rationale: public cabinet CTA and post-auth entry routing are deterministic and tested; pilots are distinguished from unpaid non-pilot tenants at the dashboard gate without removing enforcement for the latter; subscribe explains blocked access where applicable; lint, unit tests, and `cf:build` complete successfully.
