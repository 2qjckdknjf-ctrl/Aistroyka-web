# Pre-upload hard gates

Evaluated 2026-06-29 on base main `1e0de8e`.

| # | Gate | Status |
|---|------|--------|
| 1 | `APPROVE_TESTFLIGHT_UPLOAD=YES` | **MISSING** (not set) |
| 2 | `AISTROYKA_IOS_BUILD_NUMBER` present | **MISSING** |
| 3 | Apple Distribution certificate present/usable | **NO** (only Apple Development identities found) |
| 4 | App Store provisioning for `ai.aistroyka.manager` | **NO** (no matching profile) |
| 5 | App Store provisioning for `ai.aistroyka.worker` | **NO** (no matching profile) |
| 6 | ASC app record `ai.aistroyka.manager` verified | **NO** (unverifiable — no ASC API) |
| 7 | ASC app record `ai.aistroyka.worker` verified | **NO** (unverifiable — no ASC API) |
| 8 | ASC API key OR approved interactive upload path | **MISSING** |
| 9 | app-store `ExportOptions.plist` present | **NO** (none found under `ios/`) |
| 10 | Signed archive/export succeeds | **SKIPPED** (prerequisites missing) |
| 11 | Target is TestFlight only | N/A (no upload attempted) |
| 12 | No App Store submission / production release | YES (none attempted) |

## Environment probe (no secrets printed)

- `APPROVE_TESTFLIGHT_UPLOAD`: MISSING
- `AISTROYKA_IOS_BUILD_NUMBER`: MISSING
- `APP_STORE_CONNECT_API_KEY_PATH`: MISSING
- `APP_STORE_CONNECT_API_KEY_ID`: MISSING
- `APP_STORE_CONNECT_API_ISSUER_ID`: MISSING
- `APP_STORE_CONNECT_API_PRIVATE_KEY`: MISSING
- `ASC_API_KEY_PATH`: MISSING

## Local toolchain

- Xcode: 26.6 (Build 17F113)
- Developer dir: `/Applications/Xcode.app/Contents/Developer`
- Apple Distribution identity: **NO** (2 valid Apple Development identities only)
- Apple Development identities: present (count 2; names redacted)

## Provisioning profiles (metadata only)

- Profiles in `~/Library/MobileDevice/Provisioning Profiles/`: 3
- Matching `ai.aistroyka.manager`: **NO**
- Matching `ai.aistroyka.worker`: **NO**
- Present profiles are for unrelated bundle ID `com.hiair.app` and wildcard `*`

## Export options

- `ExportOptions.plist` under `ios/`: **NOT FOUND**

## Decision

Multiple required gates fail (1, 2, 3, 4, 5, 6, 7, 8, 9). Per MODE B rules, **STOP before upload**.
TestFlight readiness remains **OWNER_ACTION_REQUIRED**.
