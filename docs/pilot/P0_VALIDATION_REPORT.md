# P0 — Validation Report

**Date:** 2026-07-01  
**Branch context:** `origin/main` @ `7f1b42f`

---

## Commands run

| Check | Command | Result |
|-------|---------|--------|
| Lint | `bun run lint` | **PASS** |
| Tests | `bun run test` | **PARTIAL** — 297/298 files pass; 1 fail |
| Contracts + web build | (included in test) | contracts build OK |
| CF/OpenNext build | `bun run cf:build` | **PASS** |
| Pilot smoke (live) | `BASE_URL=https://aistroyka.ai bash scripts/smoke/pilot_launch.sh` | **PARTIAL** — cron-tick 403 |
| Mobile API chain (live) | `BASE_URL=https://aistroyka.ai bash scripts/smoke/ios_mobile_api_chain.sh` | **PASS** |
| Step 13 cost runtime (live) | `verify-cost-runtime.mjs` staging + prod | **PASS** |

---

## Test failure detail

```
FAIL  components/ai/AISignalLine.test.ts
RolldownError: Parse failure
```

- **1535 tests passed** across 297 files  
- **1 file** failed to parse (not a logic assertion failure)  
- **P0 impact:** low for pilot runtime; **should fix** before claiming full CI green

---

## Typecheck

No dedicated root `typecheck` script; TypeScript checked via build/test pipeline. `cf:build` completed successfully.

---

## Smoke dry run

`bash scripts/smoke/check_pilot_prereqs.sh --strict` — metrics auth path OK; E2E creds missing locally.

---

## Verdict

**PARTIAL** — lint + production build + live API smokes pass; one test file parse error remains.
