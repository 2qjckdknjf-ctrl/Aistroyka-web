# AIS-CLIENT-005A staging smoke — 2026-11-25

Prior closure: intake-draft idempotency YES (`docs/reports/ais-client-005a-idempotency-closure-2026-10-30/`). This slice: live staging API.

## Results

| Call | Result |
|---|---|
| `GET …/preproject/extractions` | **200** `runs:[]` then populated |
| `POST …/preproject/extractions` `{text}` | **201** run `547f3733-…`, observations include room heuristic |
| `GET …/review-pack` | **200** project review pack payload |

Intake-draft idempotency not re-exercised live (no staging intake_draft row for smoke user); code path remains CODE_PRESENT from #482.

## Verdict

Heuristic extraction + review-pack on staging: **PASS** (text-only create). Draft-bound reuse still unit/hosted covered, not re-smoked here.
