# Export & Upload Path — Owner Checklist — 2026-06-29

## Checklist

- [ ] Create/verify an app-store `ExportOptions.plist` (method `app-store-connect` / `app-store`)
  - keep team ID `43A4KW5BKB`, signing style, and bundle-ID mapping correct
  - store it as a build input (gitignored if it contains anything sensitive)
- [ ] Decide the upload path:
  - **ASC API key** (App Store Connect API, `.p8` AuthKey) — automated, **or**
  - **Interactive Xcode / Transporter** upload — manual owner step
- [ ] If using ASC API key: verify presence only (gitignored `.p8`), never print/commit values
- [ ] Confirm **build number bump** strategy (CFBundleVersion must increase per upload)
- [ ] Confirm archive/export commands:
  - `xcodebuild archive` → `xcodebuild -exportArchive -exportOptionsPlist ExportOptions.plist`
- [ ] Confirm **no upload** happens without explicit owner approval

## Notes

- TestFlight requires a signed (Distribution) archive exported with an app-store `ExportOptions.plist`.
- The `.p8` ASC API key, if used, must remain a gitignored AuthKey — presence-only checks, never values.
- A fresh build number is required for each TestFlight upload, even for identical source.
