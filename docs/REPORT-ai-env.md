# AI and env vars (web app)

Reference for which environment variables the web app uses for AI and Supabase. Used by deploy (e.g. Cloudflare), health checks, and runbooks.

## Health check

- **GET /api/health** returns:
  - **openaiConfigured**: `true` when `OPENAI_API_KEY` is set (in-app photo analysis can run).
  - **aiConfigured**: `true` when `AI_ANALYSIS_URL` is set (job processor can call AI).
  - **aiConfigMissing**: array of **names** of missing AI-related env vars (no values; safe for public response).

If `openaiConfigured` is `false` or `aiConfigured` is `false`, check `aiConfigMissing` to see which variables to set.

---

## Env vars by capability

### 1. Base (Supabase, auth)

| Variable | Required | Used for |
|----------|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase client, DB, auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase client, RLS |

### 2. In-app photo analysis (vision)

Endpoint: **POST /api/ai/analyze-image**. Construction image → structured result (stage, completion %, risk, issues, recommendations).

| Variable | Required | Notes |
|----------|----------|--------|
| `OPENAI_API_KEY` | yes | OpenAI API key; without it the route returns 503 |
| `OPENAI_VISION_MODEL` | no | Default `gpt-4o` |
| `OPENAI_VISION_TIMEOUT_MS` | no | Request timeout (default 85000, clamped 30k–120k) |
| `OPENAI_RETRY_ON_5XX` | no | Retries on 5xx (default 1, max 3) |

When **OPENAI_API_KEY** is set in the deployment env (e.g. Cloudflare), health returns **openaiConfigured: true**.

### 3. Job-based analysis and writing results to Supabase

Endpoint: **POST /api/analysis/process**. Dequeue job → call AI URL → write result to Supabase. Uses service role for RPCs.

| Variable | Required | Notes |
|----------|----------|--------|
| `AI_ANALYSIS_URL` | yes | URL of the AI analysis endpoint (e.g. this app’s `/api/ai/analyze-image` or external). If missing, job processor returns 503 |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-only; used for job RPCs and writing analysis results. If missing, process route returns 503 |
| `AI_REQUEST_TIMEOUT_MS` | no | Timeout for job processor’s AI request (default 90000, clamped 30k–120k) |
| `AI_RETRY_ATTEMPTS` | no | Retries for AI request (default 3, max 5) |

When **AI_ANALYSIS_URL** is set, health returns **aiConfigured: true**. **SUPABASE_SERVICE_ROLE_KEY** is reported as **serviceRoleConfigured** and is included in **aiConfigMissing** when missing (so you know what to set for “full” AI pipeline).

### 4. Basic chat (if applicable)

If the app uses an LLM for chat (e.g. copilot), the same **OPENAI_API_KEY** is typically used; no extra env beyond the ones above. Supabase is used for persistence via **NEXT_PUBLIC_SUPABASE_*** and optionally **SUPABASE_SERVICE_ROLE_KEY** for server-side writes.

---

## Summary table

| Capability | Required env (minimal) |
|------------|------------------------|
| Base + auth | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| In-app photo analysis | `OPENAI_API_KEY` |
| Job processor + write to Supabase | `AI_ANALYSIS_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

Health **aiConfigMissing** lists only: `OPENAI_API_KEY`, `AI_ANALYSIS_URL`, `SUPABASE_SERVICE_ROLE_KEY` (names of vars that are missing). Values are never returned.
