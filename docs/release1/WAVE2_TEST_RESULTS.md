# Wave 2 — Test results

## Commands

```bash
cd /path/to/AISTROYKA && npm run test
```

**Result:** 182 test files, **1112 tests passed**.

```bash
set -a && . apps/web/.env.local && set +a && \
  export BASE_URL="${NEXT_PUBLIC_APP_URL:-https://www.aistroyka.ai}" && \
  bash scripts/smoke/pilot_launch.sh
```

**Result:** exit code **0** — PASS health, config, cron-tick, ops/metrics.

## Targeted tests

No new route-specific tests were added this wave; regression covered by full suite + smoke.

## Failures found / fixed

- None during test run.

## Remaining non-critical gaps

- End-to-end scripted **F2–F5** proof (G4/G5) remains a **later-wave** deliverable with explicit artifacts.
- Optional: add Vitest for `GET` project reports/uploads with mocked `createClientFromRequest` (not required to close Wave 2).
