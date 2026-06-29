# Pre-upload hard gates

Evaluated 2026-06-29 on base main `95a28c2`.

| # | Gate | Status |
|---|------|--------|
| 1 | `APPROVE_GOOGLE_PLAY_UPLOAD=YES` | **MISSING** (not set) |
| 2 | `AISTROYKA_ANDROID_VERSION_CODE` present and not `1` | PRESENT (`2026062901`) |
| 3 | Play Console app record `ai.aistroyka.manager` verified | **NO** (unverifiable — no credential) |
| 4 | Play Console app record `ai.aistroyka.worker` verified | **NO** (unverifiable — no credential) |
| 5 | Play App Signing / upload key accepted or verified | **NO** (unverifiable — no credential) |
| 6 | Play service-account credential OR owner-approved interactive path | **MISSING** |
| 7 | Signed AABs build successfully with confirmed versionCode | YES (per PR #165 evidence; not re-run here) |
| 8 | Target track is internal testing only | N/A (no upload attempted) |
| 9 | No production rollout configured | YES (no upload attempted) |
| 10 | Owner/store checklist (PR #166) completed | **NO** (owner-action checklist still open) |

## Environment probe (no secrets printed)

- `APPROVE_GOOGLE_PLAY_UPLOAD`: MISSING
- `AISTROYKA_ANDROID_VERSION_CODE`: PRESENT (`2026062901`)
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`: MISSING
- `GOOGLE_PLAY_SERVICE_ACCOUNT_FILE`: MISSING
- `SUPPLY_JSON_KEY`: MISSING
- `ANDROID_PUBLISHER_CREDENTIALS`: MISSING

## Local signing inputs (keys only, redacted)

- `android/keystore.properties`: PRESENT (`storeFile`, `storePassword`, `keyAlias`, `keyPassword` — values redacted)
- `android/.secrets/upload-keystore.jks`: PRESENT
- `android/.secrets/google-play-service-account.json`: MISSING

## Decision

Multiple required gates fail (1, 3, 4, 5, 6, 10). Per MODE B rules, **STOP before upload**.
Google Play internal-testing readiness remains **OWNER_ACTION_REQUIRED**.
