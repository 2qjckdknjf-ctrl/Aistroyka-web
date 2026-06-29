# MODE B TestFlight Upload Requirements — 2026-06-29

Before a signed archive/export/TestFlight upload task can run, **all** of the following
must be true. Until then, the upload step stays hard-gated and skipped.

## Required inputs

- [ ] Explicit owner approval for TestFlight upload
- [ ] Confirmed build number (CFBundleVersion, higher than any prior upload)
- [ ] Apple Distribution certificate + App Store provisioning present
- [ ] ASC app records verified for the package being uploaded
- [ ] App-store `ExportOptions.plist` verified
- [ ] ASC API key present (gitignored `.p8`) **OR** confirmed interactive Xcode/Transporter upload path

## Hard constraints

- [ ] **No production release** / no App Store submission (TestFlight only)
- [ ] No Apple Developer / ASC mutation beyond the upload itself
- [ ] No secrets printed or committed

## Outcome gate

- If any item above is unmet → upload is skipped, `TestFlight readiness` stays `OWNER_ACTION_REQUIRED`, Apple state is not mutated.
- If all met → produce a signed archive, export with the app-store `ExportOptions.plist`, upload to **TestFlight** only, and capture the upload response (no secrets) as the closing evidence for #158.
