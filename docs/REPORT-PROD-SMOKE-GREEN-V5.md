# Production smoke green v5 — SMOKE GREEN runbook

**Date:** 2026-03-07  
**Branch:** release/phase5-2-1  
**Worker:** aistroyka-web-production  
**Domain:** https://aistroyka.ai

---

## Stage 0 — Baseline (2026-03-07)

### GET /api/v1/health
- **HTTP:** 200
- **Body (sanitized):** `{"ok":true,"db":"ok","aiConfigured":false,"openaiConfigured":true,"supabaseReachable":true,"serviceRoleConfigured":false}`

### POST /api/v1/admin/jobs/cron-tick
- **HTTP:** 503
- **Body (sanitized):** `{"ok":false,"error":"Admin client not configured","error_code":"admin_not_configured"}`

**Conclusion:** Health OK, DB reachable. `serviceRoleConfigured:false` and cron-tick 503 until `SUPABASE_SERVICE_ROLE_KEY` is set in production.

---

## Variables (names only; values REDACTED)

Production Worker must have:

| Name | Purpose |
|------|--------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public anon key |
| NEXT_PUBLIC_APP_URL | App URL (e.g. https://aistroyka.ai) |
| SUPABASE_SERVICE_ROLE_KEY | **Required for health serviceRoleConfigured:true and cron-tick 200** |
| OPENAI_API_KEY | If used |
| REQUIRE_CRON_SECRET | Optional; if `true`, cron-tick requires x-cron-secret |
| CRON_SECRET | Required only when REQUIRE_CRON_SECRET=true |

---

## Stage 1 — SUPABASE_SERVICE_ROLE_KEY (obligatory)

Supabase MCP does **not** expose `service_role` (security). Set the secret manually:

1. In **Supabase Dashboard** → Project **AISTROYKA** → **Project Settings** → **API** copy the **service_role** (secret) value.
2. In terminal (do **not** paste the value in chat):
   ```bash
   cd apps/web && npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env production
   ```
   When prompted, paste the service_role value and press Enter.
3. Redeploy so the Worker picks up the secret:
   ```bash
   cd apps/web && bun run deploy:prod
   ```
4. Verify:
   ```bash
   curl -si https://aistroyka.ai/api/v1/health
   ```
   Expect: **200** and `"serviceRoleConfigured":true`.

5. Verify cron-tick:
   ```bash
   curl -si -X POST https://aistroyka.ai/api/v1/admin/jobs/cron-tick -H "content-type: application/json"
   ```
   Expect: **200** (or 202) with JSON `ok:true` (or 403 if REQUIRE_CRON_SECRET=true and CRON_SECRET not sent).

---

## Stage 2 — CRON_SECRET (only if REQUIRE_CRON_SECRET=true)

If cron-tick returns **403** with `cron_unauthorized`:

1. Generate a secret (e.g. 32 bytes hex): `openssl rand -hex 32`
2. Set in Cloudflare:
   ```bash
   cd apps/web && npx wrangler secret put CRON_SECRET --env production
   ```
   Paste the generated value when prompted.
3. Set `REQUIRE_CRON_SECRET=true` as a Worker **var** (Dashboard or wrangler).
4. Redeploy. Call cron-tick with header:
   ```bash
   curl -si -X POST https://aistroyka.ai/api/v1/admin/jobs/cron-tick \
     -H "content-type: application/json" -H "x-cron-secret: <REDACTED>"
   ```
   Expect **200/202**.

---

## Stage 3 — GET /api/v1/ops/metrics (Bearer)

ops/metrics is tenant-scoped; it requires a signed-in user (JWT) with tenant membership.

1. **Create a smoke user** (one of):
   - **Dashboard:** Supabase → Authentication → Users → Add user (e.g. `smoke.manager@example.com`), set password, confirm email. Do not paste the password in chat.
   - **Script (with service_role in env):** use Supabase Auth Admin API to create user (e.g. `POST /auth/v1/admin/users`).
2. **Attach user to a tenant:**
   - Either set that user as **owner** of an existing tenant (`tenants.user_id` = user id), or
   - Insert into `tenant_members`: `(tenant_id, user_id, role)` e.g. `('<existing-tenant-id>', '<user-uuid>', 'admin')`.
   - Prefer a dedicated “smoke” tenant if allowed (create tenant, set `user_id` to smoke user id).
3. **Get token:** sign in with that user (e.g. `POST /auth/v1/token?grant_type=password` with email/password and anon key), get `access_token`.
4. **Call metrics:**
   ```bash
   curl -si "https://aistroyka.ai/api/v1/ops/metrics?from=2026-02-28&to=2026-03-07" \
     -H "Authorization: Bearer <REDACTED>"
   ```
   Expect **200**.

---

## Stage 4 — Pilot smoke (pilot_launch.sh)

```bash
BASE_URL=https://aistroyka.ai \
  CRON_SECRET=<REDACTED_if_REQUIRE_CRON_SECRET> \
  AUTH_HEADER="Authorization: Bearer <REDACTED>" \
  ./scripts/smoke/pilot_launch.sh
```

Or with optional bootstrap token via email/password (no secrets in command):

```bash
BASE_URL=https://aistroyka.ai \
  SMOKE_EMAIL=smoke.manager@example.com \
  SMOKE_PASSWORD=<REDACTED> \
  NEXT_PUBLIC_SUPABASE_URL=https://vthfrxehrursfloevnlp.supabase.co \
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<REDACTED> \
  ./scripts/smoke/pilot_launch.sh
```

Requirement: cron-tick OK and metrics OK (GREEN).

---

## Dynamic require (middleware-manifest)

**Status:** No longer reproduced. The runtime error `"Dynamic require of \"/.next/server/middleware-manifest.json\" is not supported"` was removed by the bundle patch (see REPORT-PROD-SMOKE-GREEN-V4.md). Production uses the patched deploy flow (`deploy:prod` → dry-run → patch → deploy --no-bundle).

---

## How to repeat smoke (commands; no secret values)

1. **Health:** `curl -si https://aistroyka.ai/api/v1/health`
2. **Cron-tick:** `curl -si -X POST https://aistroyka.ai/api/v1/admin/jobs/cron-tick -H "content-type: application/json"`
3. **Metrics:** `curl -si "https://aistroyka.ai/api/v1/ops/metrics?from=2026-02-28&to=2026-03-07" -H "Authorization: Bearer <token>"`
4. **Full smoke:** `BASE_URL=https://aistroyka.ai CRON_SECRET=*** AUTH_HEADER="Authorization: Bearer ***" ./scripts/smoke/pilot_launch.sh`
5. **Redeploy prod:** `cd apps/web && bun run deploy:prod`

---

## Cleanup: smoke user and tenant

- **Remove smoke user:** Supabase Dashboard → Authentication → Users → find the smoke user → Delete (or disable).
- **Remove smoke tenant (if created):** Supabase SQL or Dashboard: delete from `tenant_members` for that tenant, then delete the tenant row from `tenants` if it was created only for smoke.

---

## Post–Stage 1 verification

After setting `SUPABASE_SERVICE_ROLE_KEY` (see Stage 1) and redeploying:

| Endpoint | HTTP | Notes |
|----------|------|--------|
| GET /api/v1/health | 200 | Expect `serviceRoleConfigured:true` once secret is set |
| POST /api/v1/admin/jobs/cron-tick | 200/503 | 200 once secret set; 503 until then |
| GET /api/v1/ops/metrics | 200/401 | 200 with valid Bearer (tenant member) |
| pilot_launch.sh | GREEN | After secret + smoke user + AUTH_HEADER |

**Deploy version (this run):** 1b86937e-82a2-4877-8947-e7794d7eb3e7
