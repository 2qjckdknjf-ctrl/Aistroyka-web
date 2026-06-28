# Liquid Glass Slice 1 — Deploy Result

Date: 2026-06-28

## Deploy path (canonical CI pipeline)

Per `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md`, production deploys via GitHub Actions:
`Deploy Cloudflare (Staging)` (push to `main`) → on success → `Deploy Cloudflare (Production)` (`workflow_run`). There is no direct push-to-main production trigger, and no local Cloudflare credentials were configured, so no local `wrangler deploy` was run.

## Runs

| Workflow | Run ID | Trigger | SHA | Result |
|----------|--------|---------|-----|--------|
| Deploy Cloudflare (Staging) | 28323001270 | push | `c69bd40` | completed / success |
| Deploy Cloudflare (Production) | 28323106472 | workflow_run | `c69bd40` | completed / success |

## Target

- Worker: `aistroyka-web-production`
- Domain: `https://aistroyka.ai`

## Post-deploy gates in the production run

- Post-deploy pilot smoke (blocking): PASS
- Post-deploy stakeholder finance sanity (blocking): PASS
- Post-deploy AI live provider gate (non-blocking): PASS
- Post-deploy AI Phase 5 gate (non-blocking): PASS

## Result

- Deploy command used: GitHub Actions `Deploy Cloudflare (Production)` (run 28323106472), self-hosted secrets; OpenNext `cf:build` + Wrangler executed inside the workflow.
- Deployment version: build time stamp `2026-06-28 13:02` (from live `/api/v1/health`).
- Result: **PASS**.
- Local deploy log: N/A (deploy ran in CI, not locally). Run reference: `gh run view 28323106472`.
