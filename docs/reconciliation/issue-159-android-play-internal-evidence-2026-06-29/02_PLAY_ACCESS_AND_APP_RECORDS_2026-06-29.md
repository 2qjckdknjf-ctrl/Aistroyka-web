# Play Access & App Records — 2026-06-29

All checks below are **presence-only**. No credential values were printed or opened.

## Credentials presence

| Item | Status |
| --- | --- |
| `android/.secrets/google-play-service-account.json` | MISSING |
| env `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | MISSING |
| env `GOOGLE_PLAY_SERVICE_ACCOUNT_FILE` | MISSING |
| env `SUPPLY_JSON_KEY` | MISSING |
| env `ANDROID_PUBLISHER_CREDENTIALS` | MISSING |
| env `APPROVE_GOOGLE_PLAY_UPLOAD` | MISSING |

## Upload tooling presence

| Tool | Status |
| --- | --- |
| `fastlane` | NOT_FOUND |
| `bundletool` | NOT_FOUND |
| Play publishing scripts/metadata (`fastlane`/`supply`/`metadata`/publisher) | NONE (only unrelated Playwright audit JSON artifacts under `docs/audit/artifacts/`) |

## Package IDs

- `ai.aistroyka.manager`
- `ai.aistroyka.worker`

## Verifiability

- Play service account credential present: **NO**
- Play Console app records verifiable from this environment: **NO** (no credentials/tooling)
- Upload key / Play App Signing registration verified: **NO** (OWNER_ACTION_REQUIRED)

## Owner actions

1. Provision/confirm Google Play Console app records for both package IDs.
2. Enroll in Play App Signing and register the upload key (the local keystore's certificate).
3. Provide a Play publishing service-account JSON (kept gitignored, never committed) if automated upload is desired.
4. Confirm the `versionCode` to use for the first internal-testing upload.
