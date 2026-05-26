# STAGE 02 — Health / System Routes / Security Guard Report

## 1. Goal

Ensure system diagnostic endpoints are safe in production, explicitly guarded by `X-System-Key`, and operationally verifiable.

## 2. Files inspected

- `apps/web/lib/system/system-route-auth.ts`
- `apps/web/lib/system/system-route-auth.test.ts`
- `apps/web/app/api/v1/system/health/route.ts`
- `apps/web/app/api/system/health/route.ts`
- `apps/web/app/api/v1/system/metrics/route.ts`
- `apps/web/app/api/system/metrics/route.ts`
- `scripts/ops/system-health.sh`

## 3. Findings

1. Production guard logic exists and is centralized in `requireSystemRouteAuth`.
2. Policy is safe:
   - Production + missing `SYSTEM_API_KEY` -> `503` fail-closed.
   - Key set + missing/wrong `X-System-Key` -> `401`.
   - Correct key -> route proceeds to diagnostics payload.
3. Cloudflare-compatible production detection already exists through `NODE_ENV || NEXT_PUBLIC_APP_ENV`.
4. Route-level tests for authorized/unauthorized flow on `/api/v1/system/health` were missing.
5. Ops helper script existed but defaulted to legacy `/api/system/health` instead of canonical `/api/v1/system/health`.

## 4. Changes made

1. Added route tests:
   - `apps/web/app/api/v1/system/health/route.test.ts`
   - validates unauthorized short-circuit and authorized diagnostics payload path.
2. Updated `scripts/ops/system-health.sh`:
   - default endpoint changed to canonical `/api/v1/system/health`
   - added `SYSTEM_HEALTH_PATH` override for legacy/testing compatibility
   - improved output behavior for jq/no-jq environments
   - retained fail-fast non-zero exit behavior on non-200

## 5. Validation commands

```bash
bash -n scripts/ops/system-health.sh
bun run --cwd apps/web test lib/system/system-route-auth.test.ts app/api/v1/system/health/route.test.ts
```

## 6. Validation result

- Script syntax check passed.
- Tests passed (`9/9`).
- Security guard behavior is proven for:
  - no key
  - wrong key
  - correct key
  - missing `SYSTEM_API_KEY` in production
  - `NEXT_PUBLIC_APP_ENV=production` fallback detection

## 7. Remaining gaps

1. Post-deploy operator verification still required against live production key material.
2. Legacy `/api/system/*` remains available; this is acceptable for compatibility but should stay clearly documented as legacy.

## 8. Blockers

- External secret required for live guarded check: `SYSTEM_API_KEY`.

## 9. Commit hash

Pending (generated after commit in this stage).

## 10. Push status

Pending (will push immediately after stage commit).

## 11. Stage verdict

CLOSED

## 12. Post-deploy curl commands

```bash
# Expected 401 when key missing/wrong
curl -i https://aistroyka.ai/api/v1/system/health
curl -i -H "X-System-Key: wrong" https://aistroyka.ai/api/v1/system/health

# Expected 200 with diagnostics payload when key is correct
curl -i -H "X-System-Key: $SYSTEM_API_KEY" https://aistroyka.ai/api/v1/system/health

# Optional legacy compatibility check
curl -i -H "X-System-Key: $SYSTEM_API_KEY" https://aistroyka.ai/api/system/health
```

