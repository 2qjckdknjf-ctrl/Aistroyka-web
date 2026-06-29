# Final verdict — iOS TestFlight MODE B

- iOS no-sign archive readiness: **PASS** (per PR #161 evidence)
- Signed archive/export readiness: **OWNER_ACTION_REQUIRED** (skipped — Distribution cert,
  provisioning, build number, ExportOptions missing)
- TestFlight readiness: **OWNER_ACTION_REQUIRED** (no upload performed)
- App Store readiness: **NO**
- Issue #158 can close: **NO** (signed TestFlight upload evidence does not yet exist)
- Issue #160 can proceed: **NO** (still NO-GO; Android #159 also lacks Play upload evidence)

## What the owner must provide to unblock MODE B upload

1. Set `APPROVE_TESTFLIGHT_UPLOAD=YES` for the authorized run.
2. Provide Apple Distribution certificate + private key in keychain.
3. Create/download App Store provisioning profiles for `ai.aistroyka.manager` and
   `ai.aistroyka.worker` under Team `43A4KW5BKB`.
4. Verify ASC app records exist for both bundle IDs.
5. Provide ASC API key (`.p8` + key ID + issuer ID) OR approve interactive Xcode Organizer upload.
6. Add/verify app-store `ExportOptions.plist` (not currently in repo).
7. Confirm `AISTROYKA_IOS_BUILD_NUMBER` for the upload build.
8. Decide capabilities (Push Notifications / Sign in with Apple) per PR #167 checklist.
9. Complete store metadata / App Privacy per PR #167 checklist.

## Next exact step

Owner completes Apple Developer / App Store Connect prerequisites per PR #167 owner-action
checklist, provides signing credentials and `APPROVE_TESTFLIGHT_UPLOAD=YES`, then re-run MODE B
to produce signed archive/export and TestFlight upload evidence for both apps.
