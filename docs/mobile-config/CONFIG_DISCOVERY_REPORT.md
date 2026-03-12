# Config Discovery Report — iOS Local Runtime Configuration

**Date:** 2026-03-12  
**Role:** Principal iOS Configuration Engineer

---

## 1. Sources checked

| Source | Checked | Findings |
|--------|---------|----------|
| **ios/Config/** | Yes | No xcconfig files existed before this task. `.gitignore` already lists `ios/Config/Secrets.xcconfig`. |
| **Config/Secrets.xcconfig** | Yes | Not present (gitignored; expected to be created from example). |
| **Config.example.xcconfig / Secrets.xcconfig.example** | Yes | Not present; docs refer to copying from example. |
| **.env, .env.local, .env.example** | Yes | See below. |
| **apps/web/.env.example, .env.local, .env.staging.example, .env.production.example** | Yes | See below. |
| **apps/web/.dev.vars.example** | Yes | `NEXT_PUBLIC_SUPABASE_URL=https://vthfrxehrursfloevnlp.supabase.co`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`, `NEXT_PUBLIC_APP_URL=https://aistroyka.ai`. |
| **apps/web/wrangler.toml** | Yes | `[env.production.vars]` has `NEXT_PUBLIC_SUPABASE_URL = "https://vthfrxehrursfloevnlp.supabase.co"`. |
| **apps/web/wrangler.deploy.toml** | Yes | `[env.production.vars]` has `NEXT_PUBLIC_SUPABASE_URL = "https://vthfrxehrursfloevnlp.supabase.co"`. |
| **.env.example (root)** | Yes | Placeholders: `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`. |
| **.env.local (root)** | Yes | **Real values (gitignored):** `NEXT_PUBLIC_SUPABASE_URL=https://vthfrxehrursfloevnlp.supabase.co`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=<real JWT>` (same project ref). |
| **apps/web/.env.local** | Yes | Same as root `.env.local`: real Supabase URL and anon key (gitignored). |
| **ios/Shared/Sources/Shared/Config.swift** | Yes | Reads `BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` from Bundle (Info.plist) then `ProcessInfo.environment`; fallbacks: baseURL `http://localhost:3000`, Supabase empty. |
| **docs/** (worker-lite, mobile-rebuild, mobile-launch-validation, REPORT-PHASE7-*, pilot-launch, etc.) | Yes | Convention: `ios/Config/Secrets.xcconfig` with `BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`; gitignored; copy from example. BASE_URL examples: `http://localhost:3000`, `https://aistroyka.ai`. |
| **README / runbooks** | Yes | PILOT_RUNBOOK, 01_OPERATOR_RUNBOOK, 03_BUILDABILITY_AUDIT, 07_PUSH_AND_RELEASE_CONFIG reference Secrets.xcconfig and Scheme env vars. |

---

## 2. Values or patterns found

| Variable | Authoritative / usable source | Value or pattern |
|----------|------------------------------|-------------------|
| **BASE_URL** | Docs + Config.swift fallback | Local dev: `http://localhost:3000`. Production/staging: `https://aistroyka.ai`. No single “canonical” file; chosen for iOS local: `http://localhost:3000` (or override in Secrets.xcconfig). |
| **SUPABASE_URL** | wrangler.toml, .dev.vars.example, .env.local | **Real (tracked):** `https://vthfrxehrursfloevnlp.supabase.co`. Same in apps/web/wrangler.toml, wrangler.deploy.toml, .dev.vars.example. |
| **SUPABASE_ANON_KEY** | .env.local (root or apps/web) | **Real value present only in gitignored .env.local** (both root and apps/web). Not in repo; used to populate local `ios/Config/Secrets.xcconfig` on this machine. For new clones: use `Secrets.xcconfig.example` and fill from Supabase Dashboard or existing env. |

---

## 3. Authoritative source for local iOS config

- **BASE_URL:** Chosen from repo convention: `http://localhost:3000` for local iOS (Config.swift fallback). Can be overridden in `ios/Config/Secrets.xcconfig` to e.g. `https://aistroyka.ai` for testing against production.
- **SUPABASE_URL:** Use value from **apps/web/wrangler.toml** / **.dev.vars.example**: `https://vthfrxehrursfloevnlp.supabase.co` (same project as web).
- **SUPABASE_ANON_KEY:** Use value from **.env.local** (root or apps/web) when creating local `Secrets.xcconfig`; do not commit. For docs/example, use placeholder `your-anon-key` in `Secrets.xcconfig.example`.

Resulting **authoritative local iOS config**: `ios/Config/Secrets.xcconfig` (gitignored), populated from the sources above, with `ios/Config/Secrets.xcconfig.example` (tracked) as the template.
