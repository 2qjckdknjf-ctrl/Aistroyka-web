# APNS and push production setup

## Requirements

- **APNS:** APNS_KEY (.p8 file content or path), APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID.
- **FCM (Android):** FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY, FCM_TOKEN_URI (optional).

## APNS production checklist

1. Apple Developer: Create APNs key (.p8), note Key ID and Team ID.
2. App: Bundle ID must match APNS_BUNDLE_ID.
3. Env: Set APNS_KEY (content or path per your provider code), APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID.
4. Devices: Register via POST /api/v1/devices/register (tenant-authenticated); token stored for push outbox.
5. Send: Admin or job handler uses push service; outbox drained by job or cron.

## CONFIG-REQUIRED

- Keys and IDs from Apple/Google; set in production env. No code changes in this pass for push beyond documentation.
