# STATUS — AISTROYKA

> Live project status — 100% Readiness program.

---

**Last updated:** 2026-08-24  
**Main tip:** `3838726a` (merged #240 + #242)

## Now

| Field | Value |
|---|---|
| Merged | [#242](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/242) tenant priority · [#240](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/240) auth + Day-0 pack |
| Open PR | [#241](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/241) — docs stack (conflict resolve in progress) |
| Local gates (#240) | i18n, lint, **1805** tests, build, cf:build — **PASS** |
| Day-0 rehearsal | **PASS_WITH_WARNINGS** (2026-08-24) |
| Staging deploy | **PENDING** — verify `buildStamp` after GitHub staging workflow |
| Phase 12 launch | **NO** — real intake missing |

## Operator

```bash
cp docs/launch/pilot-intake.template.json docs/launch/pilot-intake.real.local.json
bun run pilot:intake:validate -- docs/launch/pilot-intake.real.local.json
bash scripts/pilot/run_day0_staging_rehearsal.sh
```

## After staging deploy

```bash
bash scripts/pilot/verify_forgot_password_route.sh https://staging.aistroyka.ai
curl -sS https://staging.aistroyka.ai/api/v1/health | jq .buildStamp.sha7
```

---

*Autonomous execution — no stop.*
