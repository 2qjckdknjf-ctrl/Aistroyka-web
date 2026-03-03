# Production auth — final report

End-to-end production login: Cloudflare Worker (OpenNext) + Supabase Auth. Configuration, diagnostics, and verification only; no business logic changes.

---

## Current production worker

- **Worker name:** aistroyka-web-production  
- **Config:** `wrangler.toml` → `[env.production]`  
- **Routes:** Managed in Cloudflare Dashboard (not in wrangler.toml). Add `aistroyka.ai/*` and `www.aistroyka.ai/*` (see docs/ROUTES_MANUAL_SETUP.md).

---

## Required env vars (names only)

Must be set in **Cloudflare Dashboard** → **Workers & Pages** → **aistroyka-web-production** → **Settings** → **Variables and Secrets** (production environment):

| Variable name | Purpose |
|---------------|---------|
| **NEXT_PUBLIC_SUPABASE_URL** | Supabase project URL |
| **NEXT_PUBLIC_SUPABASE_ANON_KEY** | Supabase anon key |
| **NEXT_PUBLIC_APP_URL** | Canonical app URL for auth redirects |

**Value for production:** `NEXT_PUBLIC_APP_URL` = `https://aistroyka.ai` (set in Dashboard; do not commit secrets).

See **docs/CLOUDFLARE_WORKER_VARS.md** for exact UI steps.

---

## Supabase Auth URL config (URLs only)

In **Supabase** → **Authentication** → **URL Configuration**:

- **Site URL:** `https://aistroyka.ai`
- **Redirect URLs:** include  
  - `https://aistroyka.ai/**`  
  - `https://www.aistroyka.ai/**`  

See **docs/SUPABASE_AUTH_PROD_SETUP.md** for full checklist and symptoms when misconfigured.

---

## How to verify

1. **Health:**  
   `curl -s https://aistroyka.ai/api/health`  
   Expect `ok: true`, `requestHost`, `appUrl`.

2. **Auth diag:**  
   `curl -s https://aistroyka.ai/api/auth/diag`  
   Expect `anonKeyPresent: true`, `supabaseUrlHost` set, `appUrl`: `https://aistroyka.ai`. No secrets; anon key is masked (first 6 + last 4).

3. **Script:**  
   `./scripts/verify-prod-auth.sh`  
   Exits non-zero if health or `anonKeyPresent` fails.

4. **Browser:**  
   Hard refresh (Cmd+Shift+R / Ctrl+Shift+R), then try login; use DevTools Network to confirm redirect URL is in Supabase allow list.

---

## Common failure modes and fixes

| Failure | Fix |
|--------|-----|
| `anonKeyPresent: false` or `supabaseUrlHost: null` | Set **NEXT_PUBLIC_SUPABASE_URL** and **NEXT_PUBLIC_SUPABASE_ANON_KEY** in Cloudflare Worker Variables (production). |
| `appUrl: null` | Set **NEXT_PUBLIC_APP_URL** = `https://aistroyka.ai` in Worker Variables. |
| Redirect loop / stuck after login | Supabase Redirect URLs must include `https://aistroyka.ai/**` and `https://www.aistroyka.ai/**`; Site URL = `https://aistroyka.ai`. |
| 401 / invalid redirect | Add the exact redirect URL Supabase returns to (check address bar or Network tab) to Redirect URLs. |
| 404 on /api/health or /api/auth/diag | Routes or DNS wrong; ensure Worker routes for `aistroyka.ai/*` and `www.aistroyka.ai/*` in Cloudflare and zone uses Cloudflare nameservers. |

---

## Go / No-Go checklist

- [ ] Cloudflare Worker **aistroyka-web-production** has Variables set: **NEXT_PUBLIC_SUPABASE_URL**, **NEXT_PUBLIC_SUPABASE_ANON_KEY**, **NEXT_PUBLIC_APP_URL** = `https://aistroyka.ai`.
- [ ] Supabase → Authentication → URL Configuration: **Site URL** = `https://aistroyka.ai`; **Redirect URLs** include `https://aistroyka.ai/**` and `https://www.aistroyka.ai/**`.
- [ ] Cloudflare Worker Triggers → Routes: `aistroyka.ai/*` and `www.aistroyka.ai/*` (zone aistroyka.ai).
- [ ] `curl -s https://aistroyka.ai/api/health` returns `ok: true` and `requestHost`.
- [ ] `curl -s https://aistroyka.ai/api/auth/diag` returns `anonKeyPresent: true` and `appUrl`: `https://aistroyka.ai`.
- [ ] `./scripts/verify-prod-auth.sh` exits 0.
- [ ] Browser login completes and redirects back to aistroyka.ai (hard refresh if needed).

**Go** when all are checked. **No-Go** until Worker vars, Supabase URLs, and routes are fixed and verification steps pass.
