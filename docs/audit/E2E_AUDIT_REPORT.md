# E2E Audit Report (Pilot)

- Generated: 2026-04-26T21:14:12.902Z
- Commit: `547b594f5410f8056b7583bd085dedf5a5fc1887`
- Artifact directory: _(no timestamped artifact dir yet — run `bun run audit:pilot`)_

## Summary

| Step | Status |
|------|--------|
| test | NOT RUN |
| build | NOT RUN |
| button_inventory | NOT RUN |
| smoke:pilot | NOT RUN |
| playwright pilot | NOT RUN |

## Broken buttons / UI audit

See Playwright output and traces under artifact dir. Search for `Error:` / failed expectations in `playwright_pilot.log`.

## Sync contract

See `tests/e2e/sync-contract.spec.ts` and redacted sync log under the timestamped artifact dir when generated.

## Core flow

See `tests/e2e/core-flow.spec.ts`. If credentials or tenant data are missing, tests document NOT VERIFIED.

## Log excerpt (Playwright)

```

```

## Final verdict (explicit)

- **BUTTONS_E2E:** FAIL
- **SYNC_E2E:** FAIL
- **CORE_FLOW_E2E:** FAIL
- **OVERALL_PILOT_READY:** FAIL

Note: pilot Playwright is one suite exit code; for independent area verdicts, inspect `playwright_pilot.log` per spec file.
