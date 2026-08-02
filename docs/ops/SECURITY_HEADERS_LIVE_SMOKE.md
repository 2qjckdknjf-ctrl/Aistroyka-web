# Security Headers Live Smoke

Header-only GitHub Actions workflow (no deploy): `.github/workflows/security-headers-live.yml`.

## Dispatch

Requires the workflow file on default branch `main`.

Inputs:

- `target`: `production` | `staging` | `both` (choice; no arbitrary URL / SSRF)
- `ref`: branch/tag/SHA containing `scripts/smoke/security_headers.sh`

Requires **two consecutive** full host-pair passes (bounded attempts, nonzero exit on exhaustion).

Host targeting: each host is passed as `SECURITY_HEADERS_BASE_URL` (not a bare ignored positional). Allowlisted bases only: `https://aistroyka.ai`, `https://www.aistroyka.ai`, `https://staging.aistroyka.ai`.

Redirect chains: `security_headers.sh` follows redirects without credentials and validates security headers on **every hop** (intermediate 3xx and final response). Nonzero `curl` exits fail closed before headers are accepted. Production smoke uses `--proto-redir =https` and rejects off-allowlist `Location` / `url_effective` hosts.

Local mocked-host contract: `python3 scripts/smoke/security_headers_mock_host.py ok|missing-redirect-csp` (opt-in `SECURITY_HEADERS_ALLOW_LOCALHOST=1` inside the harness only).

Does not send Bearer tokens and does not deploy.

## CI-only merge to main

If merging only this workflow while `main` tip is older than the live staging/production SHA, include `[skip-staging-deploy]` in the merge commit message so Staging deploy fails closed and Production `workflow_run` does not auto-promote.
