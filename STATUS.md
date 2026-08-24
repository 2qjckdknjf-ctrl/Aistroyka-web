# STATUS — AISTROYKA

> Live project status — 100% Readiness program.

---

**Last updated:** 2026-08-23  
**RC:** `v1.0.0-rc.1` @ `a7144249` (staging + prod MATCH)

## Now

| Field | Value |
|---|---|
| Consolidated PR | [#240](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/240) — **Phase 2 auth + Day-0 operator pack** |
| Local gates | i18n, lint, **1798** tests, build, cf:build — **PASS** |
| Day-0 rehearsal | **PASS** (forgot-password 404 until deploy) |
| Phase 12 launch | **NO** — real intake missing |
| Merge blocker | **WAITING_FOR_NON_AUTHOR_APPROVAL** |

## Operator

```bash
cp docs/launch/pilot-intake.template.json docs/launch/pilot-intake.real.local.json
bun run pilot:intake:validate -- docs/launch/pilot-intake.real.local.json
bash scripts/pilot/run_day0_staging_rehearsal.sh
```

## After merge + staging deploy

```bash
bash scripts/pilot/verify_forgot_password_route.sh https://staging.aistroyka.ai
```

---

*Autonomous execution — no stop.*
