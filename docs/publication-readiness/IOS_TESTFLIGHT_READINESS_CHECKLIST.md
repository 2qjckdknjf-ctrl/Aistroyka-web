# iOS TestFlight Readiness Checklist

## Build and signing

- [x] `AiStroykaWorker` simulator build succeeds.
- [x] `AiStroykaManager` simulator build succeeds.
- [ ] Release archive succeeds with real Apple signing identities.
- [ ] Provisioning profiles and bundle identifiers are configured in Apple Developer account.

## Configuration

- [x] `BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` are parameterized via xcconfig.
- [ ] `ios/Config/Secrets.xcconfig` exists locally with production/pilot-safe values.
- [ ] Environment values match target pilot backend.

## Runtime smoke (required before external pilot)

- [x] Automated UITest smoke for Worker/Manager login-screen reachability passes (`run-ios-uitest-smoke-local.sh`).
- [ ] Worker login verified on real/simulator runtime.
- [ ] Worker task list/detail verified.
- [ ] Worker day start/day end verified.
- [ ] Worker report create/photo upload/submit verified.
- [ ] Worker sync bootstrap/changes/ack verified.
- [ ] Manager login verified.
- [ ] Manager project list/detail verified.
- [ ] Manager report review approve/reject/request changes verified.
- [ ] Manager documents/costs screens verified for pilot scope.

## Runtime evidence package (required for closure)

- [ ] One artifact set per flow (video or step-by-step log + timestamp + build SHA).
- [ ] Evidence references added to `docs/publication-readiness/IOS_RUNTIME_SMOKE_REPORT.md`.
- [ ] Cross-role chain explicitly proven: worker submit -> manager review -> worker resubmit.

## Notifications and permissions

- [x] Worker has camera/photo usage descriptions in `Info.plist`.
- [ ] APNS token registration verified in target environment.
- [ ] Push notification delivery validated for pilot scenarios.

## TestFlight release ops

- [ ] App icons/metadata/screenshots prepared in App Store Connect.
- [ ] Internal testing group configured (manager + worker cohorts).
- [ ] Known limitations attached to TestFlight release notes.
- [ ] Rollback/contact path defined for pilot incidents.

## Current classification

- Current: **BUILD_VERIFIED_RUNTIME_PENDING**.
- iOS cannot be marked full pilot-ready until runtime smoke items above are closed with evidence.
- Latest local rerun (2026-05-21, stabilization pass) completed with both Worker and Manager login-surface smoke tests passing; full Layer B chain remains open.

