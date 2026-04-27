# Wave 1 — Test results

## Commands

```bash
cd apps/web && npx vitest run app/api/v1/sync/changes/route.test.ts app/api/v1/sync/ack/route.test.ts
```

**Result:** 2 files, 11 tests — **all passed**.

```bash
cd /path/to/AISTROYKA && npm run test
```

**Result:** 182 test files, **1112 tests** — **all passed**.

```bash
set -a && . apps/web/.env.local && set +a && \
  export BASE_URL="${NEXT_PUBLIC_APP_URL:-https://www.aistroyka.ai}" && \
  bash scripts/smoke/pilot_launch.sh
```

**Result:** exit **0** — PASS health, config, cron-tick, ops/metrics.

## Failures found / fixed

- Sync unit tests failed until mocks were updated from `createClient` to `createClientFromRequest` — **fixed** in Wave 1 change set.

## Remaining non-critical gaps

- Automated G3 matrix (owner/admin/member/viewer × first route per surface) is **not** part of this change set; manual / future test harness can extend coverage.
- Additional `createClient()` usages under `getTenantContextFromRequest` may exist on less critical paths; same pattern can be applied in Wave 2+ if a gate proves a defect.
