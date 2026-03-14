# Design Release Post-Deploy Report

## Stage H — Post-Deploy Verification

### Deployed URL

- **Production:** https://aistroyka.ai (Cloudflare Workers per docs)
- **Preview (if Vercel):** Check Vercel Dashboard for branch `ops/external-setup-attempt`

### Pre-Deploy Check (2026-03-14)

| Check | Result | Notes |
|-------|--------|-------|
| Homepage loads | ✓ | Public site renders |
| /brand/aistroyka-logo.png | 404 | Design release not yet deployed to production |
| /brand/aistroyka-icon.png | — | Same |
| /favicon.ico | — | — |

**Note:** Design release committed and pushed to `ops/external-setup-attempt`. Production at aistroyka.ai is served by Cloudflare. Deployment to production requires either:
1. Merge to main (if Cloudflare deploys from main)
2. Manual deploy via Cloudflare Dashboard or `bun run cf:deploy:prod`
3. Vercel preview deploy if project uses Vercel for previews

### Post-Deploy Checklist (run after deploy)

- [ ] Homepage loads
- [ ] Public header renders
- [ ] Header logo loads (/brand/aistroyka-logo.png)
- [ ] Key public pages render with new styling
- [ ] Dashboard shell loads
- [ ] Sidebar/header logo loads
- [ ] Favicon resolves
- [ ] /brand/aistroyka-logo.png returns 200
- [ ] /brand/aistroyka-icon.png returns 200
- [ ] /favicon.ico returns 200

### Final Health Status

- **Pre-deploy:** Design changes in Git; production still on previous build
- **Action:** Deploy design release to production (Cloudflare or Vercel per project config), then re-run checklist
