# Cloudflare Worker Variables (runtime env)

NEXT_PUBLIC_* variables must be available at **runtime** on the Worker. The repo does not commit secrets; set them in the Cloudflare Dashboard.

---

## Required variable names (production)

| Variable name | Purpose | Example value (do not commit) |
|---------------|---------|------------------------------|
| **NEXT_PUBLIC_SUPABASE_URL** | Supabase project URL | https://xxxx.supabase.co |
| **NEXT_PUBLIC_SUPABASE_ANON_KEY** | Supabase anon (public) key | eyJ... |
| **NEXT_PUBLIC_APP_URL** | Canonical app URL for auth redirects | https://aistroyka.ai |

---

## Where to set them (Cloudflare UI)

1. **Cloudflare Dashboard** → **Workers & Pages** → **Workers**.
2. Click **aistroyka-web-production** (or **aistroyka-web-staging** for staging).
3. Go to **Settings** → **Variables and Secrets**.
4. Under **Environment Variables**, add each name and value for **Production** (or **Staging**).
5. Save. Redeploy or wait for the next CI deploy; vars are injected at runtime.

---

## Verification

- Call **https://aistroyka.ai/api/auth/diag** (or staging URL).  
- Check `anonKeyPresent: true`, `supabaseUrlHost` set, `appUrl` = `https://aistroyka.ai`.  
- If any are null, the corresponding variable is missing or wrong in the Worker.

---

## CI / wrangler.toml

The GitHub Actions workflow does **not** inject these variables (no secrets in CI for app config). Values are set only in the Cloudflare Worker → Variables. Do not add `[env.production.vars]` with real secrets in wrangler.toml.
