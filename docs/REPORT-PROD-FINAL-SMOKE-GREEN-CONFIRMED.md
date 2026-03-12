# Production smoke green — confirmed

**Date:** 2026-03-07  
**Verdict:** SMOKE GREEN = YES

---

## 1. Incident summary

- **Before:** ops/metrics returned 401 with valid user JWT (Bearer).
- **After:** health 200, cron-tick 200, ops/metrics 200 with Bearer, pilot_launch.sh exit 0.

---

## 2. Root cause

1. **Production Worker env:** `NEXT_PUBLIC_SUPABASE_URL` was not set (or differed) in production, so the Worker could not validate the JWT issued by the real Supabase project → 401.
2. **Smoke user not in tenant:** After fixing env, ops/metrics returned 403 (user authenticated but no tenant membership). User `6262265@gmail.com` was added to the Default tenant.

---

## 3. What was fixed

- **Env consistency:** Set `NEXT_PUBLIC_SUPABASE_URL` for production in `wrangler.toml` and `wrangler.deploy.toml` under `[env.production.vars]` so the Worker uses the same Supabase project URL as the one issuing JWTs. `NEXT_PUBLIC_SUPABASE_ANON_KEY` remains set via Cloudflare Dashboard/Secrets (not in repo).
- **Tenant membership:** Inserted `tenant_members` row for user `6262265@gmail.com` in Default tenant (`6414f756-aa54-48f5-91e2-f852a7c1e837`) with role `admin`.

---

## 4. Deployed commit hash

- **App code (Bearer path):** `2ad42578` (branch `release/phase5-2-1`).
- **Config:** Production deploy used wrangler config with `NEXT_PUBLIC_SUPABASE_URL` in `[env.production.vars]`.
- **Worker version after deploy:** aistroyka-web-production (Version ID: cb1d6b20-17ca-4ae7-83c9-92a2264cad2c).

---

## 5. Environment consistency status

| Variable | Production source | Status |
|----------|-------------------|--------|
| NEXT_PUBLIC_SUPABASE_URL | wrangler [env.production.vars] | Set (https://vthfrxehrursfloevnlp.supabase.co) |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Cloudflare Dashboard / Secrets | Required for JWT validation; set by operator |
| SUPABASE_SERVICE_ROLE_KEY | Cloudflare Secrets | Used for health / server-side (not for Bearer path) |

JWT from sign-in (same Supabase project) is now validated by the Worker using the same project URL and anon key.

---

## 6. Final smoke results

| Check | Result |
|-------|--------|
| GET /api/v1/health | 200 |
| POST /api/v1/admin/jobs/cron-tick | 200 |
| GET /api/v1/ops/metrics (no auth) | 401 (expected) |
| GET /api/v1/ops/metrics (Bearer from login) | 200 |
| pilot_launch.sh (BASE_URL + SMOKE_EMAIL + SMOKE_PASSWORD + Supabase env) | PASS, exit 0 |
| Counters printed | uploads_stuck=0, uploads_expired=0, devices_offline=0, sync_conflicts=0, tasks_* |

---

## 7. Final verdict

**SMOKE GREEN = YES**
