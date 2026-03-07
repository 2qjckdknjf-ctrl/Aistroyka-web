# Phase 7.7.6 — Smoke Green Plan (Staging-First + Local Fallback)

**Date:** 2026-03-07  
**Goal:** Get pilot_launch.sh smoke GREEN via staging (preferred) or local containers; document what was tried, what worked, and exact commands.

---

## 1. Machine discovery (Stage 0)

| Check | Result |
|-------|--------|
| **sw_vers** | macOS 13.7.8 (Build 22H730) |
| **uname -m** | x86_64 |
| **node -v** | v20.20.0 |
| **bun -v** | 1.2.15 |
| **docker** | Not found |
| **podman** | Not found |
| **Port 3000** | In use (node PID 43226) |

**Strategy chosen:** **A) Staging smoke** (preferred). Local containers (B) not feasible: no Docker/podman on host.

---

## 2. What was tried

### 2.1 Staging URL discovery

- **staging.aistroyka.ai** — `curl` **timed out** (unreachable or DNS not pointing to Worker).
- **aistroyka-web-staging.z6pxn548dk.workers.dev** — **HTTP 404** (Worker not found; `wrangler deployments list --env staging` → "This Worker does not exist on your account").
- **aistroyka-web-production.z6pxn548dk.workers.dev** — **HTTP 500** (Worker exists; app returns Internal Server Error).
- **aistroyka.ai** — **HTTP 500** (same as above).

**Vercel:** `vercel` CLI not installed; not used.

**Wrangler:** Logged in; **aistroyka-web-production** exists and has deployments; **aistroyka-web-staging** does not exist on the account.

### 2.2 Staging smoke (production URL as candidate)

- **BASE_URL=https://aistroyka.ai**
- **Health:** `curl -sS ${BASE_URL}/api/v1/health` → **500** (body: "Internal Server Error"). Health route validates response with `HealthResponseSchema`; 500 indicates either backend error or contract mismatch.
- **cron-tick:** `curl -sS -X POST ${BASE_URL}/api/v1/admin/jobs/cron-tick -H "Content-Type: application/json"` → **500**.
- **ops/metrics:** Without AUTH_HEADER → **500**.
- **Smoke script run:**
  ```bash
  BASE_URL=https://aistroyka.ai ./scripts/smoke/pilot_launch.sh
  ```
  **Result:** FAIL — cron-tick HTTP 500, ops/metrics HTTP 500.

So **staging smoke did not go green**: no reachable staging URL; production URL responds but returns 500 for health, cron-tick, and ops/metrics (env/configuration issue on the Worker).

### 2.3 Local containers (Stage 2)

- **Docker / Podman:** Not installed → **skipped**.
- **Supabase CLI without brew:** `bunx supabase --version` → **2.77.0** (works). Local Supabase stack still requires a container runtime (Docker), so local bootstrap was not run.

### 2.4 Migration safety (Stage 3)

- **Migration:** `apps/web/supabase/migrations/20260303000000_base_tenants_projects.sql`
- **Scan:** Only this migration creates `tenants`, `tenant_members`, `projects`. No duplicate creation elsewhere (e.g. `organization_tenants` is a different table).
- **Idempotency:** Uses `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`. No `ALTER TABLE ... ADD COLUMN` that could conflict; compatible with `20260304000200_tenants_plan.sql` (adds `plan`).
- **Conclusion:** Safe to apply on existing DB: tables already present will be skipped; no conflicting constraints introduced.

### 2.5 Gates

- `cd apps/web && bun run test -- --run` → **PASS** (76 files, 358 tests).
- `cd apps/web && bun run cf:build` → **PASS**.

---

## 3. Exact commands run

```bash
# Stage 0
sw_vers
uname -m
node -v && bun -v
docker version 2>/dev/null || true
podman version 2>/dev/null || true
lsof -nP -iTCP:3000 -sTCP:LISTEN || true

# Staging URL probes
curl -sS -i -m 15 "https://staging.aistroyka.ai/api/v1/health"
curl -sS -i -m 15 "https://aistroyka-web-staging.z6pxn548dk.workers.dev/api/v1/health"
curl -sS -i -m 15 "https://aistroyka-web-production.z6pxn548dk.workers.dev/api/v1/health"
curl -sS -i -m 15 "https://aistroyka.ai/api/v1/health"

# Wrangler
cd apps/web && npx wrangler whoami
cd apps/web && npx wrangler deployments list --env staging
cd apps/web && npx wrangler deployments list --env production

# Smoke (production URL)
BASE_URL=https://aistroyka.ai ./scripts/smoke/pilot_launch.sh

# Supabase CLI via bunx
bunx supabase --version

# Gates
cd apps/web && bun run test -- --run
cd apps/web && bun run cf:build
```

---

## 4. Required env checklist (names only; no values)

For **cron-tick** to return 200 (and avoid 503 `admin_not_configured`):

- **SUPABASE_SERVICE_ROLE_KEY** — Must be set on the Worker (Cloudflare Dashboard → Workers & Pages → aistroyka-web-production → Settings → Variables and Secrets).

For **health** to return 200/503 with valid JSON (and avoid 500):

- **NEXT_PUBLIC_SUPABASE_URL**
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**

Optional for cron-tick when REQUIRE_CRON_SECRET is true:

- **CRON_SECRET** — Passed as `x-cron-secret` when calling cron-tick; set in Dashboard or CI and in smoke: `CRON_SECRET=... ./scripts/smoke/pilot_launch.sh`.

For **ops/metrics** to return 200:

- **AUTH_HEADER** — `Authorization: Bearer <access_token>` for a tenant member (manager/owner). Obtain token via sign-in (e.g. SMOKE_EMAIL + SMOKE_PASSWORD with same Supabase URL/anon key), or use a session cookie: **COOKIE** (e.g. `sb-...=...`).

---

## 5. Smoke results (sanitized)

| Endpoint     | BASE_URL              | Result   | Notes                          |
|-------------|------------------------|----------|---------------------------------|
| GET /api/v1/health | https://aistroyka.ai | **500**  | Internal Server Error           |
| POST cron-tick    | https://aistroyka.ai | **500**  |                                |
| GET ops/metrics   | https://aistroyka.ai | **500**  | No AUTH_HEADER                  |

**Smoke script output (sanitized):**
```
Pilot launch smoke: https://aistroyka.ai (from=2026-02-28 to=2026-03-07)
  FAIL: cron-tick → HTTP 500
  FAIL: ops/metrics → HTTP 500 (set COOKIE or AUTH_HEADER for tenant auth)
```

**Smoke GREEN?** **No.**

---

## 6. If blocked: fastest unblock path

1. **Staging/production env vars (highest impact)**  
   In **Cloudflare Dashboard** → **Workers & Pages** → **aistroyka-web-production** → **Settings** → **Variables and Secrets**, set:
   - **NEXT_PUBLIC_SUPABASE_URL**
   - **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - **SUPABASE_SERVICE_ROLE_KEY**  
   Redeploy or ensure the Worker has picked up the new vars. Then:
   - Re-check health (expect 200 or 503 with valid JSON).
   - Call cron-tick (with CRON_SECRET if REQUIRE_CRON_SECRET is true).
   - For ops/metrics, set **AUTH_HEADER** (Bearer token for a tenant member) and re-run smoke.

2. **Staging Worker**  
   To use staging instead of production: deploy the staging Worker once so it exists (`cd apps/web && bun run cf:deploy:staging` from a branch that triggers staging deploy, or deploy manually). Then set staging env vars and use the staging URL (or workers.dev URL) as BASE_URL.

3. **Local smoke (containers)**  
   Install Docker (or Podman), then:
   - `./scripts/bootstrap_local_supabase.sh`
   - `cd apps/web && bun run build && PORT=3001 bun run start`
   - `BASE_URL=http://localhost:3001 AUTH_HEADER="Authorization: Bearer <token>" ./scripts/smoke/pilot_launch.sh`  
   Use the token printed by the bootstrap script.

4. **OS / CLI**  
   No OS upgrade required for this plan. Supabase CLI works via `bunx supabase`; local stack still needs Docker.

---

## 7. Single highest-impact missing prerequisite

**Production (and optional staging) Worker env vars.**  
Until **NEXT_PUBLIC_SUPABASE_URL**, **NEXT_PUBLIC_SUPABASE_ANON_KEY**, and **SUPABASE_SERVICE_ROLE_KEY** are set in the Cloudflare Worker’s Variables and Secrets, health and cron-tick will not return success, and smoke will not go green. Setting these in the Dashboard (and optionally CRON_SECRET and a way to obtain AUTH_HEADER for ops/metrics) is the single highest-impact step.
