# MODE B Upload Requirements — 2026-06-29

Before the automated/assisted MODE B internal-testing upload task can run, **all** of
the following must be true. Until then, the upload step stays hard-gated and skipped.

## Required env / inputs

- [ ] `APPROVE_GOOGLE_PLAY_UPLOAD=YES` (explicit upload approval flag)
- [ ] `AISTROYKA_ANDROID_VERSION_CODE=<n>` (owner-confirmed integer; must be higher than any value already on the target track)
- [ ] Play service account credential present **OR** an approved interactive upload path
  - e.g. gitignored `android/.secrets/google-play-service-account.json` (never committed), or owner uploads the AAB manually in Play Console

## Required Play-side preconditions

- [ ] Play Console app record verified for the package being uploaded
- [ ] Play App Signing enrolled + upload key registered
- [ ] Internal testing track created with testers
- [ ] Signed AAB built locally (already proven READY)
- [ ] Internal testing track selected as the upload target
- [ ] **No production rollout** / no release promotion

## Upload tooling note

- No upload tooling is currently present locally (`fastlane`/`bundletool`/`supply` NOT_FOUND).
- MODE B requires either a project-approved CLI publishing tool + service account, or a documented manual Play Console upload by the owner.

## Outcome gate

- If any item above is unmet → upload is skipped, `Google Play readiness` stays `OWNER_ACTION_REQUIRED`, Play Console is not mutated.
- If all met → upload a signed AAB to **internal testing** only and capture the upload response (no secrets) as the closing evidence for #159.
