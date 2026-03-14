# Design Release Vercel Precheck

## Stage F — Vercel Deployment Precheck

### Deployment Method Expected

- **Git integration:** Vercel connected to repo; push to configured branch triggers deploy
- **Root Directory:** apps/web (per DEPLOY-VERCEL.md)
- **Build:** Uses apps/web/vercel.json — installCommand and buildCommand run from repo root

### Project Root Assumptions

- Vercel project Root Directory = `apps/web`
- installCommand: `cd ../.. && npm install --include=dev && npm run build:contracts:npm`
- buildCommand: `cd ../.. && npm run build:contracts:npm && npm run build:web:npm`

### Asset Path Verification

| Asset | Path | Next.js public | Deployable |
|-------|------|-----------------|------------|
| Logo | /brand/aistroyka-logo.png | apps/web/public/brand/ | ✓ |
| Icon | /brand/aistroyka-icon.png | apps/web/public/brand/ | ✓ |
| Favicon | /favicon.ico | apps/web/public/ | ✓ |
| Favicon 32 | /favicon-32x32.png | apps/web/public/ | ✓ |

Next.js serves `public/` at `/`; no extra config needed.

### Likely Deployment Risks

1. Branch `ops/external-setup-attempt` may trigger preview deploy only; production may deploy from `main`
2. New deps (framer-motion, lucide-react) — already in package.json; npm install will fetch them

### Actions Taken

- No vercel.json changes; current config supports monorepo build
- Asset paths verified; all use public-root references
