# FINAL OPEN ITEMS

## Blocking / External

1. **Step 13 live manager proof**  
   Authenticated owner session is available, but staging runtime still fails `POST /api/v1/projects/:id/costs` with `Create failed` (deploy/runtime parity fix required before final closure proof).

2. **Step 11 staging parity**  
   Staging route `/api/v1/approvals/pending` returns `404`; deploy/runtime parity required.

## Non-Blocking Residual

3. High volume of direct `process.env` usage outside `lib/config` (documented and bounded, but technical debt remains).
4. Large pre-existing dirty working tree increases operational risk for clean release packaging unless curated before ship.

## Top 5 Real Risks

1. Staging runtime drift risk for approvals and costs write behavior.
2. Cost-layer false-closure risk if API create failure is not resolved despite DB baseline health.
3. Deployment-target ambiguity risk (Cloudflare-first docs vs residual Vercel routing reality).
4. Regression risk from broad uncurated untracked changes in current branch.
5. Config drift risk from decentralized env reads in long-term maintenance.

