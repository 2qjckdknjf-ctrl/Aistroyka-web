# Phase 7.7.5 — Local Supabase Bootstrap + Stable Server + Smoke Green

**Date:** 2026-03-07  
**Goal:** Make `./scripts/smoke/pilot_launch.sh` green locally by starting local Supabase, applying migrations, seeding a minimal pilot dataset, running apps/web in production mode, and running smoke until cron-tick and ops/metrics return 200.

---

## 1. Commands run (exact)

### Stage 0 — Precheck
- `docker ps` — Docker was **not** available (`command not found`).
- `supabase --version` — Supabase CLI was **not** installed (install attempted via `brew install supabase/tap/supabase`; failed due to Xcode/Command Line Tools requirement on host).
- `lsof -nP -iTCP:3000 -sTCP:LISTEN` — Port 3000 was in use (node PID 43226). Alternative: **PORT=3001**, **BASE_URL=http://localhost:3001**.

### Stage 1–5 — Local Supabase and seed
- **Not executed** on this run: Docker and Supabase CLI were not available, so `supabase start` was not run.
- **Delivered instead:** Base migration, seed script, and bootstrap script so that when Docker + Supabase CLI are available, the full flow can be run.

### Stage 6 — Gates (all green)
- `cd apps/web && bun run test -- --run` — **PASS** (76 test files, 358 tests).
- `cd apps/web && bun run cf:build` — **PASS** (Next.js 15.5.12, OpenNext Cloudflare build).
- `cd apps/web && bun run build` — **PASS**.
- `cd apps/web && PORT=3001 bun run start` — Server started on **http://localhost:3001** (production mode).

### Stage 7 — Smoke (without local Supabase)
- `BASE_URL=http://localhost:3001 ./scripts/smoke/pilot_launch.sh`
- **Result:** **RED** (expected without Supabase env).
  - **cron-tick:** HTTP 503 — `admin_not_configured` (no `SUPABASE_SERVICE_ROLE_KEY` / admin client).
  - **ops/metrics:** HTTP 500 — no tenant auth (no AUTH_HEADER/COOKIE and no Supabase for session).

### Sanitized smoke output
```
Pilot launch smoke: http://localhost:3001 (from=2026-02-28 to=2026-03-07)
  FAIL: cron-tick → HTTP 503
  FAIL: ops/metrics → HTTP 500 (set COOKIE or AUTH_HEADER for tenant auth)
```

### Health check (no Supabase)
- `curl -sS http://localhost:3001/api/v1/health`
- Response (sanitized): `{"ok":false,"db":"error","reason":"missing_supabase_env","message":"Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local ..."}`

---

## 2. What was added (no secrets committed)

| Artifact | Purpose |
|----------|--------|
| `apps/web/supabase/migrations/20260303000000_base_tenants_projects.sql` | Creates `tenants`, `tenant_members`, `projects` so all later migrations apply. |
| `scripts/db/seed_local_pilot.sql` | Inserts one pilot tenant and one pilot project (fixed UUIDs; no auth IDs). |
| `scripts/bootstrap_local_supabase.sh` | One-shot: start Supabase, db reset, seed, create manager/worker users, tenant_members + worker_tasks, write `apps/web/.env.local`. |
| `.gitignore` | Entries for `apps/web/.env.local`, `supabase/.temp`, `supabase/.env`, `apps/web/supabase/.temp`, `apps/web/supabase/.env`. |

---

## 3. Env keys required (names only; values redacted)

- **NEXT_PUBLIC_SUPABASE_URL** — Local API URL from `supabase start`.
- **NEXT_PUBLIC_SUPABASE_ANON_KEY** — Anon key from `supabase start`.
- **SUPABASE_SERVICE_ROLE_KEY** — Service role key from `supabase start` (removes `admin_not_configured` for cron-tick).
- **REQUIRE_CRON_SECRET** — Optional; set to `false` locally to allow cron-tick without `x-cron-secret`.
- **AUTH_HEADER** — For smoke: `Authorization: Bearer <manager_access_token>` so ops/metrics returns 200.

---

## 4. How to reproduce locally (green smoke)

**Prerequisites**
- Docker running.
- Supabase CLI: `brew install supabase/tap/supabase` (requires Xcode Command Line Tools on macOS).
- Port 3000 free, or use PORT=3001 and BASE_URL=http://localhost:3001.

**Steps**
1. From repo root:  
   `./scripts/bootstrap_local_supabase.sh`  
   This will:
   - Run `supabase init` in `apps/web` if no `supabase/config.toml`.
   - Run `supabase start`, then `supabase db reset --no-seed`.
   - Run `scripts/db/seed_local_pilot.sql` (tenant + project).
   - Create two auth users (manager + worker) via GoTrue admin API.
   - Insert `tenant_members` and one `worker_tasks` row, set tenant owner.
   - Write `apps/web/.env.local` with local Supabase URL/keys and `REQUIRE_CRON_SECRET=false`.
   - Print the manager token and smoke command.

2. Start the app (production):  
   `cd apps/web && bun run build && bun run start`  
   (Use `PORT=3001 bun run start` if 3000 is busy.)

3. Run smoke (use the AUTH_HEADER printed by bootstrap):  
   `BASE_URL=http://localhost:3000 AUTH_HEADER="Authorization: Bearer <token>" ./scripts/smoke/pilot_launch.sh`  
   Or with CRON_SECRET if you set it:  
   `CRON_SECRET=... BASE_URL=... AUTH_HEADER=... ./scripts/smoke/pilot_launch.sh`

4. Expected: **cron-tick** 200, **ops/metrics** 200, and counters printed (uploads_*, devices_offline, sync_conflicts, tasks_*).

---

## 5. User creation (no passwords in repo)

- **Manager:** `smoke.manager+<timestamp>@example.com` — created via `POST ${SUPABASE_URL}/auth/v1/admin/users` (service role). Used for AUTH_HEADER and tenant owner.
- **Worker:** `smoke.worker+<timestamp>@example.com` — same API. Member of pilot tenant; one task assigned for today.
- Passwords are generated in the bootstrap script (e.g. `openssl rand -base64 24`) and used only in that run; never committed.

---

## 6. Remaining blockers

- **Docker:** Not available on the run host; local Supabase was not started. With Docker, run `./scripts/bootstrap_local_supabase.sh` then smoke as above.
- **Supabase CLI:** Install failed (Xcode/CLT). Once installed, bootstrap + smoke can be run as in §4.
- **Smoke green:** Achieved only when local Supabase is running and `apps/web/.env.local` is populated (and server is started with that env). This run confirmed gates (test, cf:build, build) and documented the exact flow and failure mode when Supabase is missing.

---

## 7. Commit summary

- **Branch:** `release/phase5-2-1`
- **Committed (no secrets):** Base migration, `scripts/db/seed_local_pilot.sql`, `scripts/bootstrap_local_supabase.sh`, `.gitignore` updates, this report.
- **Not committed:** `apps/web/.env.local`, any keys/tokens, or Supabase CLI config that may contain secrets.
