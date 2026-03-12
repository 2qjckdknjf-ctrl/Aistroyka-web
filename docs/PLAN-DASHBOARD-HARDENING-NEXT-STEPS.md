# Plan: Dashboard hardening next steps

Prioritized follow-ups after production dashboard 500 fix.

---

## P0 — Critical

- **Deploy and verify:** Deploy branch `fix/prod-dashboard-500-root-cause` to production. Run `BASE_URL=https://aistroyka.ai bash apps/web/scripts/smoke/dashboard_smoke.sh` and confirm GET /ru/dashboard returns 200 or 302/307, never 500.
- **Confirm production env:** Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Cloudflare production env/secrets.

---

## P1 — Important

- **Production logging (optional):** Add minimal structured server logs for dashboard SSR (e.g. route key, auth outcome, no PII), gated by an env flag (e.g. `LOG_DASHBOARD_SSR=true`) so production debugging is possible without enabling in all requests.
- **Smoke in CI:** Run `scripts/smoke/dashboard_smoke.sh` in CI against staging or production after deploy (with appropriate BASE_URL and no 500 expectation for unauthenticated /ru/dashboard if it redirects).
- **E2E:** If Playwright is used, add or update a flow: login → open /dashboard and /ru/dashboard → assert no generic server error and page content or redirect as expected.

---

## P2 — Quality improvements

- **Favicon:** Fix 404 (add or correct path) so browser and audits stop reporting it.
- **CSP eval:** Identify script that triggers eval warning (browser console or Worker logs); replace or document; do not weaken CSP without justification.
- **Dashboard widget isolation:** Ensure every client widget (ops overview, projects, etc.) is already behind error boundaries or QueryBoundary so a single failed fetch never crashes the whole page (current implementation already uses ErrorState and QueryBoundary; verify and document).
