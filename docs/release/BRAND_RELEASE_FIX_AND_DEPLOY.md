# Brand Release Fix and Deploy

**Date:** 2025-03-14

---

## Root cause

- **Design/brand** (commit cff3b26e) and **Step 13** work lived only on **ops/external-setup-attempt**.
- **Production** (https://aistroyka.ai) is served by **Cloudflare Workers**, which deploys from **main** (GitHub Actions workflow "Deploy Cloudflare (Production)" on push to main).
- **main** did not contain the design or brand assets, so the live site showed the old design and missing logo.

---

## Fix applied

1. **Merge:** Merged **ops/external-setup-attempt** into **main** (no force push, no history rewrite).
2. **Push:** Pushed **main** to **origin** so that the Cloudflare production workflow runs.
3. **Deploy status:** GitHub Actions "Deploy Cloudflare (Production)" is triggered by the push to main; build and deploy to Cloudflare run in CI. Operator should confirm in GitHub Actions that the workflow succeeded.
4. **Live verification:** After the workflow completes, verify:
   - Homepage: https://aistroyka.ai
   - Header/logo: visible in public header and dashboard shell
   - Favicon: /favicon.ico
   - Assets: https://aistroyka.ai/brand/aistroyka-logo.png , https://aistroyka.ai/brand/aistroyka-icon.png

---

## Summary

| Step | Done |
|------|------|
| Brand assets in repo | YES (committed on ops, now on main) |
| Branch mismatch fixed | YES (ops merged into main) |
| main pushed | YES |
| Cloudflare deploy triggered | YES (on push to main) |
| Live design updated | TBD — confirm after workflow completes and cache/CDN propagates |

---

## If live still shows old design

- **Workflow failed:** Fix build/deploy errors in GitHub Actions and re-run or push again.
- **Cache:** Hard refresh (Ctrl+Shift+R), incognito, or wait for CDN cache TTL.
- **Domain routing:** In Cloudflare Dashboard, confirm aistroyka.ai routes point to the correct Worker and that the latest deployment is active.
