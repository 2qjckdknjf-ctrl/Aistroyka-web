# iOS Full Runtime Proof

Date: 2026-05-22  
Project: AISTROYKA

## Status

**CLOSED (Layer B API chain live 2026-06-03)**

Mobile worker + manager transaction routes proven on production pilot via `scripts/smoke/ios_mobile_api_chain.sh`. Simulator photo upload and manager review UI taps remain TestFlight/manual follow-up.

## Evidence collected in this pass

Observed (2026-06-03):

```bash
BASE_URL=https://aistroyka.ai ./scripts/smoke/ios_mobile_api_chain.sh
# PASS — worker report/create + sync; manager me + reports
```

Prior automated smoke (Layer A):

```bash
CI_SIGNING_HACK=1 bash ios/scripts/run-ios-uitest-smoke-local.sh
```

Observed historically:

- Worker smoke test PASS (login surface reachable).
- Manager smoke test PASS (login surface reachable).

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
