# iOS Full Runtime Proof

Date: 2026-05-22  
Project: AISTROYKA

## Status

**OPERATOR_REQUIRED (not fully closed)**

## Evidence collected in this pass

Automated smoke command executed:

```bash
CI_SIGNING_HACK=1 bash ios/scripts/run-ios-uitest-smoke-local.sh
```

Observed:

- Worker smoke test PASS (login surface reachable).
- Manager smoke test PASS (login surface reachable).
- Command exit code `0`.

## Why this is not yet full runtime closure

Current automated UITests in repo validate login reachability only and do not prove:

1. Worker report create/upload/submit end-to-end chain.
2. Manager review transitions (approve/reject/request changes).
3. Cross-role submit -> review -> resubmit consistency.

## Blocking item

Full runtime transaction proof remains pending manual/operational execution per:

- `docs/release/IOS_FULL_RUNTIME_PROOF_RUNBOOK.md`
- `docs/publication-readiness/IOS_TESTFLIGHT_READINESS_CHECKLIST.md`

## Release impact

- Blocks web/API release: **No**
- Blocks iOS publication readiness claim: **Yes**
- Blocks full public multi-platform GO: **Yes**
