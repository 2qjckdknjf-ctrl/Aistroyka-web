# Xcode Config Wiring — iOS Local Configuration

**Date:** 2026-03-12  
**Role:** Principal iOS Configuration Engineer

---

## 1. Summary

Both AiStroykaWorker and AiStroykaManager are wired to use **ios/Config/Secrets.xcconfig** via a project-level **base configuration reference**. Debug and Release configurations resolve BASE_URL, SUPABASE_URL, and SUPABASE_ANON_KEY so that Info.plist substitution works and Shared Config.swift receives values at runtime.

---

## 2. File reference

| Project | File reference ID | Path | sourceTree |
|---------|-------------------|------|------------|
| AiStroykaWorker | WRK1CFG | ../Config/Secrets.xcconfig | SOURCE_ROOT |
| AiStroykaManager | MGR1CFG | ../Config/Secrets.xcconfig | SOURCE_ROOT |

- SOURCE_ROOT is the directory containing the .xcodeproj (e.g. ios/AiStroykaWorker), so the path resolves to **ios/Config/Secrets.xcconfig**.

---

## 3. Build configurations

| Project | Config | baseConfigurationReference |
|---------|--------|-----------------------------|
| AiStroykaWorker | Debug (WRK091) | WRK1CFG |
| AiStroykaWorker | Release (WRK092) | WRK1CFG |
| AiStroykaManager | Debug (MGR091) | MGR1CFG |
| AiStroykaManager | Release (MGR092) | MGR1CFG |

- The xcconfig is applied at **project** level, so all targets in the project inherit BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY as build settings.
- Info.plist in each app uses `$(BASE_URL)`, `$(SUPABASE_URL)`, `$(SUPABASE_ANON_KEY)`; at build time these are replaced by the xcconfig values.

---

## 4. Info.plist substitution

- **Worker:** AiStroykaWorker/Info.plist — keys BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY with values `$(BASE_URL)` etc.
- **Manager:** AiStroykaManager/Info.plist — same.
- ProcessInfoPlistFile merges the expanded build settings into the app’s Info.plist; the app’s Bundle then exposes these to Shared Config.swift.

---

## 5. Release configuration

- Release uses the same Secrets.xcconfig. For CI or production builds, either ensure Secrets.xcconfig exists (from secrets) or point to a different xcconfig; no project changes required beyond the single base config reference.

---

## 6. xcconfig URL escaping

- In xcconfig, `//` starts a comment. URLs must escape slashes: `http:\/\/localhost:3000`, `https:\/\/vthfrxehrursfloevnlp.supabase.co`.
- Secrets.xcconfig and Secrets.xcconfig.example use this form so values are passed correctly into build settings and Info.plist.
