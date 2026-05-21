# Live BuildStamp Verification Report

## Goal

Prove production deploy truth with live `buildStamp` metadata after redeploy.

## Deploy method used

- Canonical path: GitHub Actions production workflow `.github/workflows/deploy-cloudflare-prod.yml`
- Trigger mode: `workflow_dispatch`
- Triggered ref: `release/publication-readiness-mega-sprint`
- Run URL: <https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/26146584712>

## Deploy run result

- Workflow status: success
- Jobs:
  - Build and deploy to production: success
  - Post-deploy pilot smoke (blocking): success
  - Post-deploy AI Phase 5 gate (non-blocking): success

## Live curl verification

Commands executed:

```bash
curl -i https://aistroyka.ai/api/v1/health
curl -s https://aistroyka.ai/api/v1/health
curl -i https://www.aistroyka.ai/api/v1/health
```

Observed:

- `https://aistroyka.ai/api/v1/health` -> HTTP 200
- `https://www.aistroyka.ai/api/v1/health` -> HTTP 200
- JSON payload includes:
  - `env: "production"`
  - `buildStamp.sha7: "39c2cbb"`
  - `buildStamp.buildTime: "2026-05-20 06:55"`

## Build identity check

- Branch head at verification time includes commit `39c2cbb` in publication branch history.
- Live production now exposes concrete build identity metadata, satisfying deploy-truth requirement.

## Verdict

**CLOSED**

