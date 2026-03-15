# Production Platform Truth

**Date:** 2025-03-14

---

## What serves https://aistroyka.ai

From docs (REPORT-PRODUCTION-ROOT-REDIRECT-FINAL, PRODUCTION-CONFIG-20260305, deploy-cloudflare-prod.yml):

| Fact | Source |
|------|--------|
| Live domain | aistroyka.ai, www.aistroyka.ai |
| Platform | **Cloudflare Workers** (Worker: aistroyka-web-production) |
| Not production | Vercel does not own apex/www for this project |
| Deploy trigger | GitHub Actions workflow "Deploy Cloudflare (Production)" on **push to main** |
| Build | From repo root: `bun run cf:build` then wrangler deploy (production env) |

---

## Verification

- **Production branch in Vercel:** N/A — production is Cloudflare.
- **Latest production deployment commit:** Unknown without Cloudflare Dashboard or workflow run history; if the last deploy was from main, it is 0c51bed9 or an earlier main commit (none of which include cff3b26e).
- **Live domain points to:** Cloudflare Worker aistroyka-web-production.
- **Blocker:** Production deploy runs only on push to main; main does not contain the design/brand commit. Therefore the live site is serving a build from an older commit without brand assets.

---

## Conclusion

**Live platform:** Cloudflare Workers (aistroyka-web-production).  
**Live commit:** Assumed to be from branch main (0c51bed9 or earlier).  
**Blocker found:** YES — design and brand are on ops/external-setup-attempt; production builds from main. Fix: merge ops/external-setup-attempt into main and push to trigger Cloudflare production deploy.
