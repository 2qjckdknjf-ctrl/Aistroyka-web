# Readiness PR merge order (100% program)

**Updated:** 2026-08-24  
**Main tip:** `3838726a`

## Completed merges

| PR | Topic | SHA |
|----|-------|-----|
| [#242](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/242) | Dual-role tenant priority | `c9621cc5` |
| [#240](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/240) | Auth recovery + Day-0 operator pack | `3838726a` |

## Remaining

| PR | Topic |
|----|-------|
| [#241](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/241) | Docs stack phases 3–12 (merge after conflict resolve) |

Legacy #228–#239 may close as superseded.

## Post-merge verification

```bash
curl -sS https://staging.aistroyka.ai/api/v1/health | jq .buildStamp.sha7
bash scripts/pilot/verify_forgot_password_route.sh https://staging.aistroyka.ai
bash scripts/pilot/run_day0_staging_rehearsal.sh
```
