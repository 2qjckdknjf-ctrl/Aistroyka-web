# FINAL OPEN ITEMS

## Blocking / External

None.

## Non-Blocking Residual

1. High volume of direct `process.env` usage outside `lib/config` (documented and bounded, but technical debt remains).
2. Large pre-existing dirty working tree increases operational risk for clean release packaging unless curated before ship.

## Top 5 Real Risks

1. Deployment-target ambiguity risk (Cloudflare-first docs vs residual Vercel routing reality).
2. Regression risk from broad uncurated untracked changes in current branch.
3. Config drift risk from decentralized env reads in long-term maintenance.
4. Long-tail maintenance risk from growing execution/report documentation volume.
5. CI ecosystem drift risk (Node 20 action deprecation warnings in workflow logs).

