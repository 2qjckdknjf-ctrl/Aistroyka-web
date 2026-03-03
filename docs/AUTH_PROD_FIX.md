# Auth production fix (cabinet login)

**Goal:** Login and redirect to dashboard work on https://aistroyka.ai and https://www.aistroyka.ai.

---

## What was checked / changed (no secrets)

1. **Health check**  
   `GET https://aistroyka.ai/api/health` returns:
   - `ok`, `db`, `supabaseReachable`, and optionally `buildStamp: { sha7, buildTime }`.  
   If `ok` is false or `reason: "missing_supabase_env"`, set **NEXT_PUBLIC_SUPABASE_URL** and **NEXT_PUBLIC_SUPABASE_ANON_KEY** on the production worker (Cloudflare → aistroyka-web-production → Variables/Secrets).

2. **Supabase Auth redirect URLs**  
   In Supabase project: **Authentication → URL Configuration**:
   - **Site URL:** `https://aistroyka.ai` (or your chosen canonical domain).
   - **Redirect URLs** must include:
     - `https://aistroyka.ai/**`
     - `https://www.aistroyka.ai/**`  
   Add and save if missing. This fixes email confirmation and OAuth redirects to the production domain.

3. **Login → dashboard flow**  
   After login, the app redirects to `/en/dashboard` (or locale). If you see a blank page or wrong domain, confirm:
   - The domain is routed to **aistroyka-web-production** (see docs/CLOUDFLARE_DOMAIN_FIX_EVIDENCE.md).
   - No cookie/domain mismatch (e.g. Site URL in Supabase matches the domain you use).

4. **End-to-end**  
   Register or sign in on production → open `/en/dashboard` → dashboard and build marker visible. If it fails, check browser Network tab for 4xx/5xx on auth or API calls.

---

## No secrets in this doc

Only configuration names and URLs are documented. Credentials stay in Cloudflare Secrets and Supabase.
