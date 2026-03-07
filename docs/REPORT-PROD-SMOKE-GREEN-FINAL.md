# Production smoke green — final proof (Phase 7.7.9)

**Date:** 2026-03-07  
**Branch:** release/phase5-2-1  
**Worker:** aistroyka-web-production  
**Domain:** https://aistroyka.ai

---

## Endpoint status (post-deploy)

| Endpoint | HTTP | Result |
|----------|------|--------|
| GET /api/v1/health | **200** | `serviceRoleConfigured: true` |
| POST /api/v1/admin/jobs/cron-tick | **200** | `{"ok":true,"scheduled":0,"processed":0,"tenants":1}` |
| GET /api/v1/ops/metrics | **200** with Bearer / **401** without | Tenant-scoped; requires JWT |

---

## Variables set (names only; values REDACTED)

- NEXT_PUBLIC_SUPABASE_URL  
- NEXT_PUBLIC_SUPABASE_ANON_KEY  
- NEXT_PUBLIC_APP_URL  
- SUPABASE_SERVICE_ROLE_KEY  
- OPENAI_API_KEY (if used)  
- (CRON_SECRET only if REQUIRE_CRON_SECRET=true)

---

## Reproduction

**Health**
```bash
curl -si https://aistroyka.ai/api/v1/health
```
Expect: 200, JSON with `"serviceRoleConfigured":true`.

**Cron-tick**
```bash
curl -si -X POST https://aistroyka.ai/api/v1/admin/jobs/cron-tick -H "content-type: application/json"
```
Expect: 200, JSON `ok:true`.

**ops/metrics (with auth)**  
Get a Bearer token (e.g. sign-in with a user that has tenant membership), then:
```bash
curl -si "https://aistroyka.ai/api/v1/ops/metrics?from=2026-02-28&to=2026-03-07" -H "Authorization: Bearer <REDACTED>"
```
Expect: 200.

**Full smoke (GREEN)**  
Option A — bootstrap smoke user once (requires SUPABASE_SERVICE_ROLE_KEY and anon key in env), then script runs pilot_launch with token (token not printed):
```bash
SUPABASE_SERVICE_ROLE_KEY=*** NEXT_PUBLIC_SUPABASE_URL=https://vthfrxehrursfloevnlp.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=*** BASE_URL=https://aistroyka.ai node scripts/smoke/bootstrap_smoke_user.mjs
```

Option B — use existing user with tenant access:
```bash
BASE_URL=https://aistroyka.ai AUTH_HEADER="Authorization: Bearer <REDACTED>" ./scripts/smoke/pilot_launch.sh
```

Option C — sign-in via env (no token in command):
```bash
BASE_URL=https://aistroyka.ai SMOKE_EMAIL=... SMOKE_PASSWORD=*** NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=*** ./scripts/smoke/pilot_launch.sh
```

---

## Cloudflare tail

Use Dashboard or:
```bash
cd apps/web && npx wrangler tail aistroyka-web-production --format json
```
No dynamic require errors observed.

---

## DB changes (this run)

- `public.tenants`: added column `user_id` (if not present).  
- `public.tenant_members`: table created if not present; RLS policy for SELECT.  
- One existing user linked to Default tenant for tenant-scoped access.

Smoke user `smoke.manager@example.com` can be created via `scripts/smoke/bootstrap_smoke_user.mjs` (one-time, with service_role in env).
