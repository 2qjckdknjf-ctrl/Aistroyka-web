# Config Safety Report — iOS Local Configuration

**Date:** 2026-03-12  
**Role:** Principal iOS Configuration Engineer

---

## 1. Private config handling

- **ios/Config/Secrets.xcconfig:** Contains BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY (including real anon key). This file is **gitignored** (`.gitignore` entry: `ios/Config/Secrets.xcconfig`). It is not committed.
- **ios/Config/Secrets.xcconfig.example:** Tracked; contains no secrets (SUPABASE_ANON_KEY = `your-anon-key`, same Supabase URL as in wrangler). Safe to commit.

---

## 2. Example file

- **Secrets.xcconfig.example** is present and committed. New developers copy it to Secrets.xcconfig and fill SUPABASE_ANON_KEY (and optionally adjust BASE_URL/SUPABASE_URL). Instructions are in the example file and in docs (CONFIG_STRATEGY, CONFIG_VALUES_STATUS).

---

## 3. No secrets in tracked docs or source

- No real anon key or other secrets were added to any tracked doc or source file. CONFIG_DISCOVERY_REPORT and CONFIG_VALUES_STATUS refer to “.env.local” or “Secrets.xcconfig” as the source of the anon key without pasting it. Only Secrets.xcconfig (gitignored) holds the real key.

---

## 4. No fake secrets

- Placeholder in the example is explicitly `your-anon-key`. No fake or test JWT was committed. No other fake secrets were introduced.

---

## 5. Summary

- Local secrets file is gitignored; example file is present and safe; no secrets leaked into tracked files; no fake secrets left in repo.
