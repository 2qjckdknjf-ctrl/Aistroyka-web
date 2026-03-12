# Plan: Dashboard hardening follow-up

Prioritized next steps after the auth hardening sweep.

---

## P0 — Must-do

- **Deploy and smoke:** Deploy branch `hardening/dashboard-auth-middleware-sweep` (or merge into target branch and deploy). Run:  
  `BASE_URL=https://aistroyka.ai bash apps/web/scripts/smoke/dashboard_smoke.sh`  
  Confirm /api/v1/health, /dashboard, and /ru/dashboard do not return 500.
- **Production build:** Run `npm run build` (and `cf:build` if using Cloudflare) before merge and fix any failures.

---

## P1 — Should-do

- **E2E / Playwright:** Add or update a smoke flow: login → open /dashboard and /ru/dashboard → assert no generic server error and that main shell or redirect is correct.
- **CI smoke:** Run dashboard_smoke.sh in CI against staging or production (with appropriate BASE_URL and exit code handling).
- **Optional production logging:** Add minimal structured logs for dashboard SSR (e.g. route, auth outcome) behind an env flag for production debugging without PII.

---

## P2 — Nice-to-have

- **Favicon:** Fix 404 if the asset is missing or path is wrong.
- **audit_* artifacts:** Remove or refactor if they are no longer needed; otherwise document that they are legacy and not used in production.
- **CSP eval:** Continue to investigate the eval warning separately; do not weaken CSP without evidence.
