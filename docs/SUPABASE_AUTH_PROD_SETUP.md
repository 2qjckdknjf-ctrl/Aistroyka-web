# Supabase Auth — production configuration (aistroyka.ai)

Exact steps so login works end-to-end with Cloudflare Worker + Supabase Auth. No secrets in this doc; only URLs and checklist.

---

## 1. URL configuration (Supabase Dashboard)

1. Open **Supabase Dashboard** → your project → **Authentication** → **URL Configuration**.
2. Set:
   - **Site URL:** `https://aistroyka.ai` (use `https://staging.aistroyka.ai` on the staging project / when testing recovery from staging)
   - **Redirect URLs:** add (one per line or as comma-separated depending on UI):
     - `https://aistroyka.ai/**`
     - `https://www.aistroyka.ai/**`
     - Staging (required for forgot-password emails opened from staging): `https://staging.aistroyka.ai/**`
     - Optional (for debugging): your workers.dev URL, e.g. `https://aistroyka-web-production.<account>.workers.dev/**`
3. Save.

Password recovery `redirectTo` is `{request origin}/api/auth/callback?callback=/{locale}/reset-password&recovery=1` (see `docs/auth/PASSWORD_RECOVERY.md`). If the origin is missing from Redirect URLs, the email link fails with “invalid redirect URL” even when `POST /api/v1/auth/forgot-password` returned 200.

---

## 2. Expected symptoms when misconfigured

| Symptom | Likely cause | Fix |
|--------|----------------|-----|
| Redirect loop after login | Site URL or Redirect URLs don’t match the origin the browser is on | Set Site URL = `https://aistroyka.ai`; add `https://aistroyka.ai/**` and `https://www.aistroyka.ai/**` to Redirect URLs. |
| Stuck on login / never redirects back | Redirect URL not in allow list | Add the exact origin (e.g. `https://www.aistroyka.ai/**`) to Redirect URLs. |
| 401 / invalid session | Wrong Supabase URL or anon key on the Worker | Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Cloudflare Worker Variables; verify with `/api/auth/diag` (`anonKeyPresent: true`, `supabaseUrlHost` set). |
| “Invalid redirect URL” from Supabase | Request origin not in Redirect URLs | Add that origin (and path pattern) to Redirect URLs; ensure `NEXT_PUBLIC_APP_URL` is `https://aistroyka.ai` so the app uses the correct canonical URL. |

---

## 3. How to verify (no Supabase UI access from Cursor)

**Strict manual checklist:**

- [ ] Site URL = `https://aistroyka.ai`
- [ ] Redirect URLs include `https://aistroyka.ai/**` and `https://www.aistroyka.ai/**`
- [ ] Cloudflare Worker has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL` set (see docs/CLOUDFLARE_WORKER_VARS.md)

**Verify using /api/auth/diag and browser:**

1. Open **https://aistroyka.ai/api/auth/diag** in the browser (or `curl -s https://aistroyka.ai/api/auth/diag`).
2. Check:
   - `anonKeyPresent: true`
   - `supabaseUrlHost` = your Supabase project host (e.g. `xxxx.supabase.co`)
   - `appUrl` = `https://aistroyka.ai`
   - `requestHost` = `aistroyka.ai` or `www.aistroyka.ai` when you load from that host.
3. In browser DevTools → Network: trigger login and check the redirect to Supabase and back; the final redirect URL should match one of the allowed Redirect URLs.
4. If login still fails, compare `requestOrigin` and `requestHost` in diag with what you added in Supabase Redirect URLs; add any missing origin pattern.
