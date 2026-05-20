# iOS Runtime Smoke Report

## Goal

Collect real runtime evidence for iOS Worker/Manager pilot readiness.

## Commands executed

```bash
xcodebuild test -project ios/AiStroykaWorker/AiStroykaWorker.xcodeproj \
  -scheme AiStroykaWorker \
  -destination id=F807605D-F0FA-45DA-961E-B1AC69A27A91 \
  -only-testing:AiStroykaWorkerUITests/WorkerSmokeUITests/testLoginScreen_reachableWithPilotIdentifiers \
  CODE_SIGN_IDENTITY=- CODE_SIGNING_REQUIRED=NO

xcodebuild test -project ios/AiStroykaManager/AiStroykaManager.xcodeproj \
  -scheme AiStroykaManager \
  -destination id=F807605D-F0FA-45DA-961E-B1AC69A27A91 \
  -only-testing:AiStroykaManagerUITests/ManagerSmokeUITests/testLoginAndOpenReportsInbox_withPilotIdentifiers \
  CODE_SIGN_IDENTITY=- CODE_SIGNING_REQUIRED=NO
```

## Observed evidence

1. Worker UITest run:
   - `** TEST SUCCEEDED **`
   - `WorkerSmokeUITests.testLoginScreen_reachableWithPilotIdentifiers` passed.
2. Manager UITest run:
   - `** TEST SUCCEEDED **`
   - `ManagerSmokeUITests.testLoginAndOpenReportsInbox_withPilotIdentifiers` executed in runtime smoke context.

## Latest rerun (live-closure pass)

Executed:

```bash
CI_SIGNING_HACK=1 bash ios/scripts/run-ios-uitest-smoke-local.sh
```

Rerun result:

- Worker smoke passed: `testLoginScreen_reachableWithPilotIdentifiers`
- Manager smoke passed: `testLoginScreen_reachableWithPilotIdentifiers`
- Script confirms both UITest smoke targets pass end-to-end in simulator runtime.

## Additional rerun (continuation pass)

Executed again:

```bash
CI_SIGNING_HACK=1 bash ios/scripts/run-ios-uitest-smoke-local.sh
```

Observed:

- command finished successfully (`exit 0`)
- evidence remains login-surface smoke level
- no new runtime proof for full worker submit/upload/sync chain and manager approve/reject/resubmit chain

## Coverage status versus target runtime matrix

- Proven now:
  - Worker login surface reachable in simulator runtime
  - Manager login surface reachable in simulator runtime
- Still not fully proven in this run:
  - Worker end-to-end report create/upload/submit/sync transaction with live pilot credentials
  - Manager approve/reject/request-changes transitions through runtime UI flow
  - Documents/costs runtime UI actions in iOS app (if enabled in current product slice)

## Classification

- **PARTIAL (improved runtime evidence, full pilot flow still pending)**

## Remaining operator/TestFlight checks

- Continue with `docs/publication-readiness/IOS_TESTFLIGHT_READINESS_CHECKLIST.md` full flow items.
- Capture proof artifacts (screens/video + app logs) for worker report and manager review action chain.

