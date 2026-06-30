# Pre-upload hard gates

Evaluated 2026-06-30 on base main `bcbe628`.

| # | Gate | Status |
|---|------|--------|
| 1 | `APPROVE_GOOGLE_PLAY_UPLOAD=YES` | **MISSING** (not set) |
| 2 | `AISTROYKA_ANDROID_VERSION_CODE` present and not `1` | PRESENT (`2026062901`) |
| 3 | Play Console app record `ai.aistroyka.manager` verified | **NO** (unverifiable — no credential/access) |
| 4 | Play Console app record `ai.aistroyka.worker` verified | **NO** (unverifiable — no credential/access) |
| 5 | Play App Signing / upload key verified (Manager) | **NO** (unverifiable) |
| 6 | Play App Signing / upload key verified (Worker) | **NO** (unverifiable) |
| 7 | Service-account credential OR owner-approved interactive path | **MISSING** |
| 8 | Upload permission for both apps | **NO** (unverifiable) |
| 9 | Manager signed AAB builds | YES (per PR #165 evidence; not re-run) |
| 10 | Worker signed AAB builds | YES (per PR #165 evidence; not re-run) |
| 11 | Target track internal testing only | N/A (no upload attempted) |
| 12 | Production rollout not configured | YES (no upload attempted) |

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

Required gates fail (1, 3, 4, 5, 6, 7, 8). Per MODE B rules, **STOP before upload** and do not mutate
Play Console. Google Play internal-testing readiness remains **OWNER_ACTION_REQUIRED**.

Note: despite the task framing ("use the available Google Play Console access"), no owner-approval
flag and no Play credential/access are present in this environment, so no upload could be performed.
