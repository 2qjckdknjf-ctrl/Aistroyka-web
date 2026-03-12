# Shared Config Validation — iOS Local Configuration

**Date:** 2026-03-12  
**Role:** Principal iOS Configuration Engineer

---

## 1. Shared/Config.swift behavior

- **Bundle lookup:** `Bundle.main.object(forInfoDictionaryKey: "BASE_URL")` (and SUPABASE_URL, SUPABASE_ANON_KEY). With xcconfig wired, these keys are written into the app’s Info.plist at build time, so the app reads the values injected from Secrets.xcconfig.
- **Environment fallback:** If a key is missing or empty in the Bundle, `ProcessInfo.processInfo.environment["BASE_URL"]` etc. are used.
- **Code fallbacks:** baseURL → `"http://localhost:3000"`; supabaseURL and supabaseAnonKey → `""`.

---

## 2. xcconfig-injected values

- After wiring and a clean build, the built app’s Info.plist contains BASE_URL, SUPABASE_URL, and SUPABASE_ANON_KEY with the values from Secrets.xcconfig (verified for AiStroykaWorker app bundle). Config.swift does not need to change; Bundle lookup will receive these values.

---

## 3. Fallback safety

- If Secrets.xcconfig is missing or a key is absent, the build may still succeed (empty or unresolved $(VAR)); at runtime Config falls back to environment then to the defaults above. Empty Supabase URL/key leads to auth failure with a clear error (AuthService throws “Supabase URL not configured…”), not a hard crash.

---

## 4. Consistency across apps

- Both apps use the same xcconfig file and the same Info.plist key names; Shared Config.swift is used by both. No app-specific config logic was added; both read config consistently.

---

## 5. Conclusion

- No changes to Shared/Config.swift were required. Bundle lookup, fallback order, and empty-value behavior are correct and safe for the new xcconfig-based setup.
