# Config Values Status — iOS Local Configuration

**Date:** 2026-03-12  
**Role:** Principal iOS Configuration Engineer

---

## 1. Values found and wired

| Variable | Source | Wired into |
|----------|--------|------------|
| **BASE_URL** | Repo convention (Config.swift fallback, docs): local dev = `http://localhost:3000` | ios/Config/Secrets.xcconfig (and .example). Escaped as `http:\/\/localhost:3000` in xcconfig. |
| **SUPABASE_URL** | apps/web/wrangler.toml, .dev.vars.example: `https://vthfrxehrursfloevnlp.supabase.co` | ios/Config/Secrets.xcconfig and Secrets.xcconfig.example. Escaped as `https:\/\/vthfrxehrursfloevnlp.supabase.co`. |
| **SUPABASE_ANON_KEY** | .env.local (root and apps/web), gitignored | ios/Config/Secrets.xcconfig only. Not in .example (placeholder `your-anon-key`). |

---

## 2. Where final local values live

- **ios/Config/Secrets.xcconfig** (gitignored): Holds the real local values — BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY (anon key from .env.local).
- **ios/Config/Secrets.xcconfig.example** (tracked): Same keys; BASE_URL and SUPABASE_URL set to the same URLs; SUPABASE_ANON_KEY = `your-anon-key`. New developers copy to Secrets.xcconfig and replace the anon key (and optionally BASE_URL/SUPABASE_URL).

---

## 3. Missing values

- **None** for this machine: BASE_URL, SUPABASE_URL, and SUPABASE_ANON_KEY were all available (URLs from repo, anon key from .env.local).
- For a **new clone**: SUPABASE_ANON_KEY must be filled in by the developer (Supabase Dashboard → Project Settings → API, or copy from team .env.local if shared out-of-band). BASE_URL and SUPABASE_URL can be left as in the example to use local backend and the same Supabase project.

---

## 4. Optional: point iOS at production

- To use production web app: set `BASE_URL = https:\/\/aistroyka.ai` in Secrets.xcconfig (and ensure Supabase project matches production). No code changes required.
