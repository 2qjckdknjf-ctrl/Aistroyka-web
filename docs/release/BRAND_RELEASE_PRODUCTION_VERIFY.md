# Brand Release — Production Verification

**Date:** 2025-03-15

---

## Cloudflare deploy

- **Trigger:** GitHub Actions workflow "Deploy Cloudflare (Production)" runs on push to **main**. Main was pushed with the design merge; the workflow is triggered by that push.
- **Evidence:** origin/main is at 6f3547a2 (includes design commit cff3b26e). Workflow run must be confirmed in GitHub → Actions for the commit that deployed to production.
- **Blockers:** None for trigger. If the workflow failed, fix build/deploy errors and re-run or push again.

---

## Live production checks

| URL | Method | Result |
|-----|--------|--------|
| https://aistroyka.ai/ | fetch | 307 redirect |
| https://aistroyka.ai/ru | fetch | 200 |
| https://aistroyka.ai/en | fetch | 200 — **content is new design** (AI Construction Intelligence, Request Demo, Try AI demo, Construction control metrics, etc.) |
| https://aistroyka.ai/brand/aistroyka-logo.png | fetch | **404** |
| https://aistroyka.ai/brand/aistroyka-icon.png | fetch | **404** |
| https://aistroyka.ai/favicon.ico | fetch | **404** |

---

## Interpretation

- **Homepage content:** The live site serves the **new design** copy and structure (headline, CTAs, sections). The production Worker is serving the updated app.
- **Static assets:** Logo, icon, and favicon URLs return 404. Possible causes: (1) OpenNext/Cloudflare assets build did not include public/brand or public/favicon in the deployed assets, (2) asset path or binding differs in production, (3) cache or routing. Operator should confirm in GitHub Actions that the production deploy completed successfully and that the build output includes `.open-next/assets` with `brand/` and favicon files; if present, check Cloudflare Worker Static Assets config and any CDN caching.
