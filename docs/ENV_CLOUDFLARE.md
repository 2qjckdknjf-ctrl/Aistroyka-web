# Required env vars for apps/web on Cloudflare Workers

Production (and staging) need these set in **Cloudflare Dashboard** so the Worker can reach Supabase and optional services. Do **not** put secrets in `wrangler.toml`; use **Workers & Pages** → **aistroyka-web-production** → **Settings** → **Variables and Secrets**.

---

## Required (auth / cabinet)

| Variable | Description | Where to set |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (e.g. `https://xxx.supabase.co`) | Cloudflare Worker **Variables** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Cloudflare Worker **Secrets** (recommended) or Variables |

Without these, login and dashboard will fail; `/api/health` returns 503 and `reason: "missing_supabase_env"`.

---

## Optional

| Variable | Description |
|----------|-------------|
| `AI_ANALYSIS_URL` | Job processor / AI service URL (for background analysis). |
| `OPENAI_API_KEY` | For in-app `/api/ai/analyze-image` (if used). Prefer **Secrets**. |

---

## Verification

- **GET /api/health** returns `{ ok, db, aiConfigured, openaiConfigured, supabaseReachable }`.  
  - `db: "ok"` and `supabaseReachable: true` when Supabase env is set and reachable.  
  - No secrets or URLs are echoed in the response.
