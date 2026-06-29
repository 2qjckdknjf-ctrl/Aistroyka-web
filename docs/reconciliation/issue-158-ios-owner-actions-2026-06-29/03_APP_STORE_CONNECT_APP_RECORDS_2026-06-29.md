# App Store Connect App Records — Owner Checklist — 2026-06-29

Create/verify the App Store Connect (ASC) app records. Each app is a separate ASC record.

## AiStroykaManager — `ai.aistroyka.manager`

- [ ] Verify/create ASC app record
- [ ] Confirm bundle ID is **exactly** `ai.aistroyka.manager` (must match the Xcode target)
- [ ] Confirm app name (e.g. "AiStroyka Manager")
- [ ] Confirm SKU (e.g. `aistroyka-manager`), bundle, platform (iOS)
- [ ] Confirm primary language
- [ ] Confirm user access / roles (who can manage builds/testers)

## AiStroykaWorker — `ai.aistroyka.worker`

- [ ] Verify/create ASC app record
- [ ] Confirm bundle ID is **exactly** `ai.aistroyka.worker` (must match the Xcode target)
- [ ] Confirm app name (e.g. "AiStroyka Worker")
- [ ] Confirm SKU (e.g. `aistroyka-worker`), bundle, platform (iOS)
- [ ] Confirm primary language
- [ ] Confirm user access / roles

## Notes

- The bundle ID on the ASC record must match the archived app exactly or upload will be rejected.
- App record creation is a prerequisite for any TestFlight build to appear.
