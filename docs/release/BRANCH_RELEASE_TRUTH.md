# Branch Release Truth

**Date:** 2025-03-14

---

## Git state

| Item | Value |
|------|--------|
| Current branch | ops/external-setup-attempt |
| HEAD commit | 6f3547a2 (docs release audit update) |
| Design commit | cff3b26e (feat(design): publish brand system...) |
| main HEAD | 0c51bed9 |
| merge-base(main, ops/external-setup-attempt) | 0c51bed9 (main) |

So **main is an ancestor of ops/external-setup-attempt**. The design commit cff3b26e and all subsequent work (Step 13, etc.) exist only on ops/external-setup-attempt; **main does not contain the design release**.

---

## Answers

- **Design branch:** ops/external-setup-attempt (contains cff3b26e and brand assets).
- **Production branch:** main — Cloudflare production deploy workflow triggers on **push to main** (see .github/workflows/deploy-cloudflare-prod.yml: `on.push.branches: [main]`).
- **Merged/pushed:** NO — design has not been merged into main; therefore production has never been built from a commit that includes the brand assets.

---

## Blocker

Production (aistroyka.ai) is served by Cloudflare, which is deployed by GitHub Actions on push to **main**. Because the design and brand assets exist only on ops/external-setup-attempt, production will show the old design until ops/external-setup-attempt is merged into main and main is pushed.
