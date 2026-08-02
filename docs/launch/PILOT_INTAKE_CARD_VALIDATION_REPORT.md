# Pilot Intake Card — Validation Report

**Date:** 2026-07-03  
**Scope:** Intake artifact + local validation tooling (no product code changes)

---

## Files created

| File | Purpose |
|------|---------|
| `docs/launch/PILOT_INTAKE_CARD.md` | Human fillable intake card |
| `docs/launch/pilot-intake.template.json` | Empty machine-readable template |
| `docs/launch/pilot-intake.example.json` | Safe demo intake (`example.com` only) |
| `scripts/pilot/validate_pilot_intake.mjs` | Local GO/NO-GO readiness validator |

## Files updated

| File | Change |
|------|--------|
| `docs/launch/P4_PILOT_CLIENT_INTAKE.md` | Reference to intake card + JSON + validator |
| `docs/launch/P4_LAUNCH_GO_NO_GO_CHECKLIST.md` | Intake card, JSON validation, signoff gates |

---

## Validation commands

```bash
node --check scripts/pilot/validate_pilot_intake.mjs
node scripts/pilot/validate_pilot_intake.mjs docs/launch/pilot-intake.example.json
node scripts/pilot/validate_pilot_intake.mjs docs/launch/pilot-intake.template.json
```

---

## Results

| Input | Exit code | Verdict |
|-------|-----------|---------|
| `pilot-intake.example.json` | **0** | **READY** (launch-critical fields present; Day 0 warnings remain) |
| `pilot-intake.template.json` | **1** | **NOT READY** (expected — empty template) |
| `node --check` on script | **0** | Syntax OK |

### Example warnings (expected before kickoff)

- TestFlight not installed on devices
- Tenant/project not created
- Invites not sent
- Smokes not passed
- Client signoff pending

---

## Known limitations

1. Validator checks **minimum launch-critical JSON fields**, not live platform state.
2. Day 0 provisioning smokes still require operator execution (`PILOT_DAY0_*` docs).
3. Real client JSON must stay **gitignored** — do not commit PII.
4. `READY` ≠ **Launch allowed YES** — complete Day 0 checklist + physical device smoke + client signoff still required.
5. Android blocker enforced when `androidOnlyWorkers` or worker `androidOnly` true without `scope.androidSupport.included`.

---

## Verdict

Intake card system **complete and validated locally**. Operator can fill template → validate → proceed to Day 0 runbooks when **READY** and warnings cleared.
