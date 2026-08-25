# STATUS — AISTROYKA

> Live project status — 100% Readiness program.

---

**Last updated:** 2026-08-25  
**Active mobile slice:** `mobile/ios-worker-v4-3` — closable tails done (notify project_id, issue PATCH, iOS 16 nav, analysis poll). Owner-gated: deploy, SMS, TestFlight, live E2E  
**Main tip:** `bae89752`  
**Staging:** `buildStamp.sha7=bae8975` — **MATCH**

## Now

| Field | Value |
|---|---|
| Merged | [#242](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/242) tenant priority · [#240](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/240) auth + Day-0 · [#241](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/241) docs stack |
| Staging forgot-password | **LIVE** (HTTP 200) |
| Day-0 rehearsal | **PASS_WITH_WARNINGS** (2026-08-24, post-deploy) |
| Phase 12 launch | **NO** — real client intake missing |
| Next gate | Owner fills `pilot-intake.real.local.json` + device smoke |

## Operator

```bash
cp docs/launch/pilot-intake.template.json docs/launch/pilot-intake.real.local.json
bun run pilot:intake:validate -- docs/launch/pilot-intake.real.local.json
bash scripts/pilot/run_day0_staging_rehearsal.sh
bash scripts/pilot/verify_forgot_password_route.sh https://staging.aistroyka.ai
```

---

*Autonomous execution — no stop.*
