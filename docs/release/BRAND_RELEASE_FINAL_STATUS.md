# Brand Release — Final Status

**Date:** 2025-03-15

---

## Summary

| Item | Status |
|------|--------|
| Brand assets in repo (main) | YES |
| Design merge to main | YES |
| main pushed to origin | YES |
| Cloudflare deploy triggered | YES (on push to main) |
| Live homepage reflects new design | YES (content verified) |
| Live /brand/aistroyka-logo.png | 404 |
| Live /brand/aistroyka-icon.png | 404 |
| Live /favicon.ico | 404 |

---

## Verdict

- **Design/brand code:** Released to main and deployed; live HTML is the new design.
- **Static brand assets (logo, icon, favicon):** Not loading on production (404). Follow-up: verify OpenNext build output includes `public/brand/` and `public/favicon.ico` in `.open-next/assets`, and that Cloudflare Worker Static Assets are configured and up to date for the production deployment.

---

## Operator follow-up

1. In **GitHub Actions**, confirm the "Deploy Cloudflare (Production)" run for commit 6f3547a2 (or the merge commit) completed successfully.
2. If assets are 404, inspect the build artifact or local `apps/web/.open-next/assets` after `bun run cf:build` and confirm `brand/` and `favicon.ico` exist; then confirm production Worker is using the same assets directory and that routes/cache are not blocking `/brand/*` or `/favicon.ico`.
