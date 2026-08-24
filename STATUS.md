# STATUS — AISTROYKA

> Live project status — 100% Readiness program.

---

**Last updated:** 2026-08-24  
**RC:** `v1.0.0-rc.1` @ `a7144249` (staging + prod MATCH)

## Now

| Field | Value |
|---|---|
| Consolidated PR | [#240](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/240) — **Phase 2 auth + Day-0 operator pack** (CI green) |
| Critical fix PR | [#242](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/242) — dual-role tenant priority (CI green, 31 tests PASS local) |
| Docs stack PR | [#241](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/241) — phases 3–12 reports |
| Day-0 rehearsal | **PASS_WITH_WARNINGS** (2026-08-24) |
| Staging forgot-password | **404** — expected until #240 merge + deploy |
| Phase 12 launch | **NO** — real intake missing |
| Merge blocker | **BLOCKED_EXTERNAL_REVIEWER_SESSION_REQUIRED** (`GITHUB_REVIEWER_TOKEN` → HTTP 401) |

## Merge order (after non-author APPROVED)

1. **#240** — code (auth recovery + operator pack)
2. **#242** — tenant membership priority fix (contractor + stakeholder dual role)
3. **#241** — docs stack

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
