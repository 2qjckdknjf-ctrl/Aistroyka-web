# Apple Developer Signing — Owner Checklist — 2026-06-29

## Checklist

- [ ] Verify Apple Developer team `43A4KW5BKB` is active and in good standing
- [ ] Verify/create an **Apple Distribution** certificate for the team
- [ ] Verify/create **App Store** provisioning profile for `ai.aistroyka.manager`
- [ ] Verify/create **App Store** provisioning profile for `ai.aistroyka.worker`
- [ ] Confirm the chosen signing path:
  - Xcode-managed automatic signing, **or**
  - manual signing with explicit certificate + profile
- [ ] Confirm certificates and provisioning profiles are **not** committed to the repo
- [ ] Confirm local signing secrets stay in gitignored `ios/Config/Secrets.xcconfig` (never committed)

## Notes

- The Apple Distribution certificate is account-wide; App Store provisioning profiles are per bundle ID.
- If using automatic signing, Xcode manages the App Store profile during archive/export.
- Do not print or commit any private key, `.p12`, `.cer`, or `.mobileprovision` content.
