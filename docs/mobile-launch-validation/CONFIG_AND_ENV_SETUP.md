# Configuration and Runtime Setup — iOS Launch Validation

**Date:** 2026-03-12  
**Role:** Principal iOS Release Engineer + Mobile Stabilization Lead

---

## 1. Runtime config overview

Both apps read at runtime:

| Key | Purpose | Info.plist | Fallback (Shared/Config.swift) |
|-----|---------|------------|----------------------------------|
| BASE_URL | Web API base (e.g. dashboard) | `$(BASE_URL)` | `http://localhost:3000` |
| SUPABASE_URL | Supabase project URL | `$(SUPABASE_URL)` | `""` |
| SUPABASE_ANON_KEY | Supabase anon key | `$(SUPABASE_ANON_KEY)` | `""` |

- Values are read from **Bundle** (Info.plist) first, then **process environment**, then the fallbacks above.
- Empty Supabase URL/key causes auth/sign-in to fail with a clear error; app does not hard-crash.

---

## 2. Where to set values

### Option A: Build settings / xcconfig

- Add a `.xcconfig` (e.g. `Config/Secrets.xcconfig`) with:
  - `BASE_URL = http://localhost:3000`
  - `SUPABASE_URL = https://your-project.supabase.co`
  - `SUPABASE_ANON_KEY = your-anon-key`
- Add the xcconfig to the project and assign it to the Debug (and Release) configuration.
- **Recommendation:** Keep `Secrets.xcconfig` in `.gitignore` and commit an example `Secrets.xcconfig.example` with placeholder values.

### Option B: Scheme environment variables

- Edit Scheme → Run → Arguments → Environment Variables.
- Add `BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- Useful for local runs without committing secrets.

### Option C: Defaults only (no backend)

- Do nothing: `BASE_URL` becomes `http://localhost:3000`; Supabase URL/key are empty.
- App launches; login/sign-in will fail until a real backend and Supabase are configured.

---

## 3. xcconfig usage in repo

- As of this audit, **no xcconfig files** are in the iOS projects. Info.plist uses `$(BASE_URL)` etc.; if these are not set in build settings or Scheme, the **fallbacks in Config.swift** apply at runtime.
- To make config explicit and maintainable, add a Debug xcconfig (and optionally a gitignored Secrets.xcconfig) as in Option A.

---

## 4. Scheme environment variables

- Not required for build. For launch, either set in Scheme (Option B) or rely on Config fallbacks.
- Same variable names: `BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.

---

## 5. Fallback behavior when config is missing

| Scenario | Behavior |
|----------|----------|
| BASE_URL unset | Config.baseURL = `http://localhost:3000`. |
| SUPABASE_URL / SUPABASE_ANON_KEY unset | Config returns `""`. Auth (Supabase) calls will fail; app shows login/session error, no crash. |
| Backend down / unreachable | Network requests fail; UI should show error state (implementation-dependent). |

---

## 6. Recommended local configuration path

1. **Quick local run (simulator, no backend):** Use defaults; app launches, login fails gracefully.
2. **Local run with backend:** Set `BASE_URL` (and optionally Supabase) via Scheme env or xcconfig.
3. **Staging/Production:** Use xcconfig or CI-injected build settings; keep secrets out of repo (e.g. Secrets.xcconfig in .gitignore).

---

## 7. Summary

- Config is **explicit** in Info.plist and **centralized** in Shared `Config.swift` with safe fallbacks.
- No runtime config is **required** for the app to build and launch; only for full login/API functionality.
- For a clear, maintainable local path: add an example xcconfig and document Scheme env vars (as in this doc).
