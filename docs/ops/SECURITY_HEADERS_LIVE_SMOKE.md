# Security Headers Live Smoke

Header-only GitHub Actions workflow (no deploy): `.github/workflows/security-headers-live.yml`.

## Dispatch

Requires the workflow file on default branch `main`.

Inputs:

- `target`: `production` | `staging` | `both` (choice; no arbitrary URL / SSRF)
- `ref`: branch/tag/SHA containing `scripts/smoke/security_headers.sh`

Requires **two consecutive** full host-pair passes (bounded attempts, nonzero exit on exhaustion).

Host targeting: each host is passed as `SECURITY_HEADERS_BASE_URL` (not a bare ignored positional). Allowlisted bases only: `https://aistroyka.ai`, `https://www.aistroyka.ai`, `https://staging.aistroyka.ai`.

Does not send Bearer tokens and does not deploy.

## CI-only merge to main

If merging only this workflow while `main` tip is older than the live staging/production SHA, include `[skip-staging-deploy]` in the merge commit message so Staging deploy fails closed and Production `workflow_run` does not auto-promote.
