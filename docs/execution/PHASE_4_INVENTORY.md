# Phase 4 — Inventory (Product Truth Hardening)

**Date:** 2026-04-18  
**Stage:** A — Current Truth Inventory  
**Scope lock:** release/runtime truth hardening only.

## Current reality snapshot

1. Phase 0-3 product loops are runtime-proven on staging.
2. Deployment truth is partially split:
   - build/deploy job succeeds,
   - post-deploy pilot smoke may fail due to auth secret/token drift.
3. Current smoke path relies on static bearer secret and can fail when JWT expires or loses tenant scope.

## Existing hardening assets

- Reusable smoke workflow:
  - `.github/workflows/pilot-smoke.yml`
- Smoke execution script:
  - `scripts/smoke/pilot_launch.sh`
- Env/config gate:
  - `scripts/release/check-env-config.sh`
- Tenant-scoped metrics endpoint:
  - `apps/web/app/api/v1/ops/metrics/route.ts`

## Gaps to close in Phase 4

1. Remove single-point failure on static pilot bearer token.
2. Preserve blocking smoke semantics while making auth recovery deterministic.
3. Ensure deploy workflows pass all optional runtime auth inputs for fallback mode.

## First remediation slice selected

- Add fallback credential path for pilot smoke:
  - if provided bearer auth fails (`401`), mint user token at runtime and retry.
- Wire optional staging/production smoke fallback secrets into deploy workflows.
