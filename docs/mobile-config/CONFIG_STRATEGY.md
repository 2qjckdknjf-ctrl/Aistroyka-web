# iOS Local Config Strategy — iOS Configuration

**Date:** 2026-03-12  
**Role:** Principal iOS Configuration Engineer

---

## 1. Chosen strategy

- **Primary:** Gitignored `ios/Config/Secrets.xcconfig` per local machine with real values.
- **Template:** Tracked `ios/Config/Secrets.xcconfig.example` with variable names and placeholders (no secrets).
- **Consumption:** Both AiStroykaManager and AiStroykaWorker Xcode projects use the same xcconfig via **project-level** base configuration reference (Debug and Release).
- **Fallback:** Shared `Config.swift` already falls back to Bundle → ProcessInfo.environment → defaults; no change to backend contracts.

---

## 2. File layout

```
ios/
  Config/
    Secrets.xcconfig          # Gitignored; real BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY
    Secrets.xcconfig.example  # Tracked; placeholders only
```

- **Secrets.xcconfig:** Created from discovery (repo + .env.local). Listed in `.gitignore`; not committed.
- **Secrets.xcconfig.example:** Committed; new developers copy to `Secrets.xcconfig` and fill anon key (and optionally BASE_URL/SUPABASE_URL if different).

---

## 3. Xcode wiring

- Each project (Worker, Manager) references **one** xcconfig path: `../Config/Secrets.xcconfig` (relative to the `.xcodeproj`).
- **Project** build configurations (Debug and Release) set `baseConfigurationReference` to that file so that:
  - `BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` become build settings.
  - Info.plist substitution `$(BASE_URL)`, `$(SUPABASE_URL)`, `$(SUPABASE_ANON_KEY)` resolves at build time.
- If `Secrets.xcconfig` is missing (e.g. fresh clone), Xcode will warn or fail to load; documented in README/runbooks to copy from example and fill values.

---

## 4. Why this over alternatives

- **Scheme env only:** Would require every developer to set three vars in Scheme; easy to forget and not shared. xcconfig is one file, same for both apps.
- **Single shared base:** Both apps live under `ios/` and use the same backend/Supabase project; one `Config/Secrets.xcconfig` keeps them aligned.
- **Existing convention:** Docs (REPORT-PHASE7-*, worker-lite, mobile-launch-validation) already specify `ios/Config/Secrets.xcconfig` and gitignore; we follow that.

---

## 5. Release configuration

- **Debug:** Uses `Secrets.xcconfig` so local runs get real config.
- **Release:** Same base config reference; Release builds (e.g. for TestFlight) will also get the same vars from `Secrets.xcconfig`. For CI/automated Release builds, either provide the file from secrets or use a CI-specific xcconfig; no change to project wiring.
