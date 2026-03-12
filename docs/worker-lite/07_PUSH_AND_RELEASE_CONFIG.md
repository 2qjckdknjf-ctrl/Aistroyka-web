# Worker Lite — Push and Release Config

**Date:** 2025-03-11

## 1. APNS / Device Registration

- **App:** PushRegistrationService saves APNS token in Keychain; registerIfNeeded() calls WorkerAPI.registerDevice(pushToken:) when token and auth are available. Token is never logged or shown in UI.
- **Backend:** POST /api/v1/devices/register (body: device_id, platform: "ios", token); allowed for ios_lite.
- **Graceful when push not configured:** If no token, registerIfNeeded() returns; no crash. App works without push.

## 2. Production Push Requirements

| Item | Detail |
|------|--------|
| Capabilities | Add **Push Notifications** in Xcode (Signing & Capabilities) and in Apple Developer portal for the App ID. |
| Bundle ID | POTA.WorkerLite — must match App ID with Push Notifications enabled. |
| APNS auth | Production: APNs Auth Key (.p8), Team ID, Key ID; or legacy certificates. Backend must send push via APNs with this app’s bundle id and token. |
| Provisioning | Profile must include Push Notifications; automatic signing can manage this when capability is added. |

## 3. Entitlements

- **Current:** AiStroykaWorker.entitlements is empty (dict with no keys).
- **For push:** Add Push Notifications capability in Xcode; Xcode will add the `aps-environment` entitlement (development or production). Do not hand-edit unless required.

## 4. Config Points

| Config | Source | Notes |
|--------|--------|-------|
| API base URL | BASE_URL in Secrets.xcconfig or Scheme env | e.g. https://your-app.vercel.app |
| Supabase URL | SUPABASE_URL | Supabase project URL. |
| Supabase anon key | SUPABASE_ANON_KEY | Supabase anon/public key. |
| Environment switch | Not present | Single BASE_URL; use different xcconfig or scheme env per build. |
| App identifiers | PRODUCT_BUNDLE_IDENTIFIER = POTA.WorkerLite | Set in target. |

## 5. Documentation

- **ios/Config/README.md** exists; document that Secrets.xcconfig (gitignored) must define BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY for run/archive.
- Pilot runbook: use AiStroykaWorker scheme; provide Secrets.xcconfig or scheme environment variables; for push, add capability and configure backend with same bundle id and APNs credentials.
