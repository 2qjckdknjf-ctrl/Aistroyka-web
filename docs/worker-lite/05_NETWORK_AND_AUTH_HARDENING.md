# Worker Lite — Network and Auth Hardening

**Date:** 2025-03-11

## 1. Networking Layer

- **APIClient (actor):** URLSession; base URL from Config.apiBaseURL (BASE_URL + /api/v1). Auth via tokenProvider closure (Bearer). Headers: x-device-id, x-client (ios_lite), x-idempotency-key when provided, Content-Type application/json.
- **Config:** BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY from Info.plist (xcconfig vars) or ProcessInfo.environment. apiBaseURL = baseURL + /api/v1.
- **Token injection:** RootView.onAppear sets APIClient.shared.setTokenProvider { await AuthService.shared.getAccessToken() }. All API requests after that use the token when present.

## 2. Verification

| Item | Status |
|------|--------|
| Base URL handling | ✅ Config.apiBaseURL; path trimmed of leading slash; relative URL to base. |
| Auth token injection | ✅ tokenProvider() used in request(); Bearer set when token non-nil. |
| Refresh / session persistence | ✅ Keychain (session token, user id); no refresh token; re-login on expiry. |
| Request timeout | ⚠️ URLSession.default; no custom timeout. Acceptable for pilot. |
| Error mapping | ✅ APIError.from(data:response:); statusCode, code, message; isUnauthorized, isForbidden, isConflict, isRateLimited. |
| Decoding resilience | ✅ JSONDecoder keyDecodingStrategy convertFromSnakeCase; throws on decode failure. |

## 3. Unauthorized / Expired / Offline

| Scenario | Current behavior |
|----------|-------------------|
| 401 | APIError thrown; isUnauthorized true. Call sites (e.g. WorkerAPI, SyncService) surface error to UI (errorMessage, lastError). |
| Expired session | No automatic refresh; next API call fails with 401; user sees error and can re-login. |
| Network offline | NetworkMonitor; SyncService shows offline; URLSession.data(for:) can throw; errors surface in catch. |
| Server error | APIError.from maps body; message shown in UI where errorMessage or lastError is displayed. |

## 4. Manager-Only Endpoints

- Worker Lite uses only WorkerAPI + SyncService + Auth (Supabase). No ManagerAPI or manager routes. **Confirmed:** no manager-only endpoints used.

## 5. x-client Identity

- APIClient.clientProfile = "ios_lite" (set at bootstrap; not overridden in Worker app). Consistent for all /api/v1 requests.

## 6. Recommendations (Optional for Pilot)

- Add explicit 401 handling in one place (e.g. APIClient or a central error handler) to clear session and show "Session expired, please sign in again" if desired.
- Consider custom URLSessionConfiguration timeouts for upload-heavy flows.
