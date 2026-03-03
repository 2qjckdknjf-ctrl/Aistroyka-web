# Production auth — final report (aistroyka.ai)

End-to-end login: Cloudflare Worker + Supabase Auth. Configuration, diagnostics, and verification only; no business logic changes.

---

## Baseline (Phase 0)

- **Branch:** main  
- **wrangler.toml:**  
  - Base name: `aistroyka-web`  
  - `[env.production]` name: `aistroyka-web-production`  
  - `[env.staging]` name: `aistroyka-web-staging`  
  - Production: `workers_dev = false`, `preview_urls = false`  
  - Routes: **not** managed in wrangler.toml (commented out); add in Cloudflare Dashboard (see docs/ROUTES_MANUAL_SETUP.md).

---

## Current production worker name

**aistroyka-web-production** (from wrangler.toml `[env.production]`).

---

## Required env vars (names only) and where to set them

| Variable name | Where to set | Purpose |
|---------------|--------------|---------|
| **NEXT_PUBLIC_SUPABASE_URL** | Cloudflare Worker → Settings → Variables and Secrets (Production) | Supabase project URL |
| **NEXT_PUBLIC_SUPABASE_ANON_KEY** | Cloudflare Worker → Settings → Variables and Secrets (Production) | Supabase anon key (public) |
| **NEXT_PUBLIC_APP_URL** | Cloudflare Worker → Settings → Variables and Secrets (Production) | Canonical app URL for auth redirects; use `https://aistroyka.ai` |

Values are **not** in the repo or CI. Set them only in the Cloudflare Dashboard. See **docs/CLOUDFLARE_WORKER_VARS.md**.

---

## Supabase Auth URL config (URLs to apply)

In **Supabase** → **Authentication** → **URL Configuration**:

- **Site URL:** `https://aistroyka.ai`
- **Redirect URLs:**  
  - `https://aistroyka.ai/**`  
  - `https://www.aistroyka.ai/**`  
  - (Optional) workers.dev URL pattern for debugging

See **docs/SUPABASE_AUTH_PROD_SETUP.md** for full steps and misconfiguration symptoms.

---

## How to verify with /api/auth/diag and /api/health

1. **Health:**  
   `curl -s https://aistroyka.ai/api/health`  
   Expect JSON with `"ok": true`, `requestHost`, `appUrl` (no secrets).

2. **Auth diag:**  
   `curl -s https://aistroyka.ai/api/auth/diag`  
   Expect: `anonKeyPresent: true`, `supabaseUrlHost` set, `appUrl` = `https://aistroyka.ai`. Anon key is only shown masked (first 6 + last 4). See **docs/AUTH_DIAG.md**.

3. **Local script:**  
   `./scripts/verify-prod-auth.sh`  
   Calls both endpoints and exits non-zero if `anonKeyPresent` is not true or health is not ok.

---

## Common failure modes and fixes

| Failure | Fix |
|--------|-----|
| `anonKeyPresent: false` or `supabaseUrlHost: null` | Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Cloudflare Worker Variables (Production). Redeploy or wait for next deploy. |
| `appUrl: null` | Set `NEXT_PUBLIC_APP_URL` = `https://aistroyka.ai` in Cloudflare Worker Variables. |
| Redirect loop / stuck login | In Supabase URL Configuration, set Site URL = `https://aistroyka.ai` and add `https://aistroyka.ai/**` and `https://www.aistroyka.ai/**` to Redirect URLs. |
| 401 / invalid session | Confirm Worker vars match Supabase project; verify with /api/auth/diag. |
| 5xx or worker not found on aistroyka.ai | Add routes in Cloudflare (aistroyka.ai/*, www.aistroyka.ai/*); check DNS and nameservers. See **docs/DOMAIN_VERIFY.md** and **docs/ROUTES_MANUAL_SETUP.md**. |

---

## Go / No-Go checklist

- [ ] **Cloudflare Worker Variables** (Production): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL` set.
- [ ] **Supabase URL Configuration:** Site URL = `https://aistroyka.ai`; Redirect URLs include `https://aistroyka.ai/**` and `https://www.aistroyka.ai/**`.
- [ ] **Routes:** aistroyka.ai/* and www.aistroyka.ai/* assigned to aistroyka-web-production in Cloudflare.
- [ ] **Health:** `curl -s https://aistroyka.ai/api/health` returns `"ok": true`.
- [ ] **Auth diag:** `curl -s https://aistroyka.ai/api/auth/diag` shows `anonKeyPresent: true`, `appUrl` = `https://aistroyka.ai`.
- [ ] **Script:** `./scripts/verify-prod-auth.sh` exits 0.
- [ ] **Browser:** Login flow completes without redirect loop; hard refresh (Cmd+Shift+R) if needed.

**Go** when all are checked. **No-Go** until Worker vars, Supabase URLs, and routes are correct and verification steps pass.
