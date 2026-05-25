# STRICT PILOT SMOKE ENV RUNBOOK

Date: 2026-05-22  
Project: AISTROYKA

## Purpose

Provide an exact operator-safe checklist to make `bun run smoke:pilot:check --strict` pass and to prepare full pilot smoke execution.

## Script source of truth

- `scripts/smoke/check_pilot_prereqs.sh`
- `scripts/smoke/pilot_launch.sh`

## Required env vars (classified)

### A) Strict requirement for `--strict` PASS (metrics auth path)

At least one auth path must be present:

1. `AUTH_HEADER` (secret; must be `Bearer <supabase_user_jwt>`)
2. `COOKIE` (secret; authenticated session cookie string)
3. `SMOKE_EMAIL` + `SMOKE_PASSWORD` + Supabase public pair:
   - `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` (public config)
   - `SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public publishable/anon key)

### B) Needed for full pilot/e2e closure (not required for strict-only PASS)

- `E2E_EMAIL` (secret)
- `E2E_PASSWORD` (secret)
- `PLAYWRIGHT_BASE_URL` (public runtime URL)
- `SUPABASE_ACCESS_TOKEN` (secret PAT for Supabase CLI project/link operations)

## Where to set each variable

- Local shell (one-off validation): `export ...`
- CI (GitHub Actions): repository/environment secrets
- Cloudflare runtime: Worker env/secrets where applicable (not needed for local prereq script itself)

## Presence validation without exposing values

Use this safe check pattern:

```bash
check_var() { local n="$1"; if [[ -n "${!n:-}" ]]; then echo "$n=SET"; else echo "$n=MISSING"; fi; }

check_var AUTH_HEADER
check_var COOKIE
check_var SMOKE_EMAIL
check_var SMOKE_PASSWORD
check_var SUPABASE_URL
check_var NEXT_PUBLIC_SUPABASE_URL
check_var SUPABASE_ANON_KEY
check_var NEXT_PUBLIC_SUPABASE_ANON_KEY
check_var E2E_EMAIL
check_var E2E_PASSWORD
check_var PLAYWRIGHT_BASE_URL
check_var SUPABASE_ACCESS_TOKEN
```

## Commands

### 1) Strict prereq check

```bash
bun run smoke:pilot:check --strict
```

### 2) Pilot smoke execution

```bash
BASE_URL=https://staging.aistroyka.ai bash scripts/smoke/pilot_launch.sh
BASE_URL=https://aistroyka.ai bash scripts/smoke/pilot_launch.sh
```

### 3) Optional pilot e2e

```bash
bun run --cwd apps/web e2e:pilot
```

## Latest observed result (this sprint)

- `bun run smoke:pilot:check --strict`: **PASS** when `SMOKE_EMAIL/SMOKE_PASSWORD` and Supabase URL+anon vars are supplied.
- Remaining non-strict warnings can still appear if `E2E_*` and `SUPABASE_ACCESS_TOKEN` are missing.
