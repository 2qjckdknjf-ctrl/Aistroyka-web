# iOS Full Runtime Proof Runbook

Date: 2026-05-22  
Project: AISTROYKA

## Goal

Collect real runtime evidence beyond login smoke for Worker + Manager release-critical transaction chain.

## Current automated coverage

- Available UITests cover login surface only:
  - `WorkerSmokeUITests.testLoginScreen_reachableWithPilotIdentifiers`
  - `ManagerSmokeUITests.testLoginScreen_reachableWithPilotIdentifiers`
- Automation command:

```bash
CI_SIGNING_HACK=1 bash ios/scripts/run-ios-uitest-smoke-local.sh
```

## Minimum full runtime transaction path (required)

### Worker

1. Login with pilot worker account.
2. Load project/task list from backend (bootstrap/sync).
3. Open or create report/task entry.
4. Attach media (photo/gallery flow) if enabled in current slice.
5. Submit/finalize report.
6. Confirm backend acceptance (status/update visible in API-backed UI).
7. Confirm app remains stable (no crash/hang).

### Manager

1. Login with pilot manager account.
2. Open project/report inbox.
3. Perform review action (approve / reject / request changes).
4. Confirm resulting status propagated to backend.
5. Confirm app stability.

### Cross-role chain

1. Worker submit -> Manager review action.
2. If request changes: Worker resubmit.
3. Final state visible in both apps/backend.

## Evidence package requirements

- Screen recording (or timestamped screenshot sequence) per major step.
- Build metadata: app version, commit SHA, date/time, simulator/device model.
- Backend/API evidence: response/status snapshots for submit/review transitions.
- Error/crash evidence if fail: Xcode logs + app logs + exact failing step.

## Pass criteria

- Full worker+manager chain completed on pilot backend.
- State transitions observable and consistent.
- No crash or fatal runtime error.
- Artifacts linked in:
  - `docs/release/IOS_FULL_RUNTIME_PROOF.md`
  - `docs/publication-readiness/IOS_RUNTIME_SMOKE_REPORT.md`
  - `docs/publication-readiness/IOS_TESTFLIGHT_READINESS_CHECKLIST.md`

## Fail criteria

- Any required step cannot be completed.
- Backend status cannot be confirmed.
- Crash or persistent instability in chain flow.

## Operator notes

- Use production-like pilot credentials and target environment.
- Do not include secrets in screenshots, recordings, or logs.
