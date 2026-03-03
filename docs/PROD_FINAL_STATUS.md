# Production final status

**Goal:** https://aistroyka.ai serves the new enterprise UI from apps/web; every future UI change is visible on the domain.

---

## Verification checklist (all must pass before done)

| # | Check | Result |
|---|--------|--------|
| 1 | workers.dev shows new header "AISTROYKA.AI — AI Command Center" + build marker with latest sha7 | ☐ |
| 2 | aistroyka.ai shows the **same** header + build marker sha7 | ☐ |
| 3 | /dashboard redirects to /en/dashboard | ☐ |
| 4 | /login works and dashboard is accessible after auth | ☐ |
| 5 | CI (Deploy Cloudflare Production) is green | ☐ |

---

## Evidence

**Current prod commit (sha7):** _______________ (from GitHub Actions last successful run)

**Domain working:** Yes / No  
**Routes correct:** aistroyka.ai/* and www.aistroyka.ai/* → aistroyka-web-production (see docs/CLOUDFLARE_DOMAIN_FIX_EVIDENCE.md)  
**CI green:** Yes / No  

**Screenshots or console logs:** (paste or attach)
- workers.dev dashboard: _______________
- aistroyka.ai dashboard: _______________

---

## Next steps for design expansion

- Single source of truth: **apps/web** only. All UI changes go in apps/web; CI deploys it to aistroyka-web-production.
- Build marker: Footer "Build: \<sha7\> / \<time\>" and optional GET /api/health `buildStamp` confirm which deploy is live.
- To verify a release: Push to main → wait for deploy → open https://aistroyka.ai/en/dashboard (logged in) → check header and footer sha7 match Actions commit.
