# Supabase Auth — production configuration

Exact steps so login works end-to-end on **aistroyka.ai** (Cloudflare Worker + Supabase Auth). No secrets in this doc; only URLs and checklist.

---

## 1. URL configuration (Supabase Dashboard)

1. Open **Supabase Dashboard** → your project → **Authentication** → **URL Configuration**.
2. Set:
   - **Site URL:** `https://aistroyka.ai`
   - **Redirect URLs:** add (one per line or comma-separated, depending on UI):
     - `https://aistroyka.ai/**`
     - `https://www.aistroyka.ai/**`
     - Optional (for workers.dev debugging): your Worker’s `*.workers.dev` URL pattern, e.g. `https://aistroyka-web-production.*.workers.dev/**`
3. Save.

---

## 2. Expected symptoms when misconfigured

| Symptom | Likely cause | Fix |
|--------|----------------|-----|
| Redirect loop after login | Site URL or Redirect URLs don’t match the actual origin (e.g. missing www or wrong domain). | Set Site URL to `https://aistroyka.ai`; add both `https://aistroyka.ai/**` and `https://www.aistroyka.ai/**` in Redirect URLs. |
| Stuck on Supabase login / never returns to app | Redirect URL not in the allow list. | Add the exact URL Supabase redirects to (check browser address bar or DevTools Network) to Redirect URLs. |
| 401 / “Invalid redirect” | Redirect URL not allowed or Site URL mismatch. | Same as above; ensure no trailing slash mismatch (use `/**`). |
| Blank or “missing env” after redirect | Worker doesn’t have `NEXT_PUBLIC_APP_URL` / Supabase vars. | Set Worker Variables in Cloudflare (see docs/CLOUDFLARE_WORKER_VARS.md). |

---

## 3. Verification (no Supabase UI access from here)

### Step 1: Auth diag endpoint

```bash
curl -s https://aistroyka.ai/api/auth/diag
```

Check:

- `anonKeyPresent: true`
- `supabaseUrlHost` = your Supabase project host (e.g. `xxxx.supabase.co`)
- `appUrl` = `https://aistroyka.ai`
- `requestHost` = `aistroyka.ai` (or www when called with that host)

If any of these are wrong or null, fix Worker Variables or Supabase URL config first.

### Step 2: Browser DevTools

1. Open https://aistroyka.ai and try login.
2. **Network:** Inspect the request to Supabase Auth (e.g. `auth/v1/...`) and the redirect back. Note the **exact redirect URL** (query params and path).
3. If Supabase returns an error, the response body usually mentions “redirect” or “URL”; add that URL to Redirect URLs in Supabase.
4. **Console:** Look for CORS or “blocked by redirect” errors; they often point to a redirect URL or origin mismatch.

### Step 3: Strict checklist (manual)

- [ ] Supabase → Authentication → URL Configuration: **Site URL** = `https://aistroyka.ai`
- [ ] **Redirect URLs** include `https://aistroyka.ai/**` and `https://www.aistroyka.ai/**`
- [ ] Cloudflare Worker **aistroyka-web-production** has Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL` = `https://aistroyka.ai`
- [ ] `/api/auth/diag` returns `anonKeyPresent: true` and correct `appUrl` / `requestHost`
- [ ] After login, browser is sent to a URL that matches one of the Redirect URLs (no trailing slash or scheme mismatch)
