# Phase 1 — Production Environment Finalization

**Goal:** Make production environment setup deterministic and verifiable.

---

## Environment variable reference

| Variable | Required? | Where used | Effect if missing |
|----------|------------|------------|--------------------|
| **CORE** | | | |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Auth, DB, storage, health | Health 503, auth broken, app unusable |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Auth, DB client, health | Health 503, auth broken |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Callbacks, redirects, links | OAuth/callback failures, wrong links |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Jobs, cron-tick, analysis/process, admin | Cron/jobs fail; 503 on job process |
| `NODE_ENV` | **Yes** | Everywhere (production vs dev) | Debug may be enabled; wrong behavior |
| **CRON** | | | |
| `REQUIRE_CRON_SECRET` | **Yes in prod** | cron-auth.ts | Set `true` in production or cron is open |
| `CRON_SECRET` | **Yes when REQUIRE_CRON_SECRET=true** | cron-auth.ts | 503 from cron-tick if required and missing |
| **AI** | | | |
| `OPENAI_API_KEY` | Optional | server.ts, analyze-image, jobs | AI analyze-image 503; jobs no vision |
| `AI_ANALYSIS_URL` | Optional | analysis/process route | In-app job processing uses this URL |
| `ANTHROPIC_API_KEY` | Optional | provider.anthropic | Fallback vision provider |
| `GOOGLE_AI_API_KEY` / `GEMINI_API_KEY` | Optional | provider.gemini | Fallback vision provider |
| **BILLING** | | | |
| `STRIPE_SECRET_KEY` | Optional | stripe.client.ts | Billing APIs no-op |
| `STRIPE_WEBHOOK_SECRET` | Optional | webhook route | Webhook signature check fails |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional | Client checkout | Checkout/portal not configured |
| **PUSH** | | | |
| `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` | Optional | push FCM | No Android push |
| `APNS_KEY`, `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID` | Optional | push APNS | No iOS push |
| **FORBIDDEN_IN_PROD** | | | |
| `DEBUG_AUTH` | Must be unset/false | debug.ts, _debug/auth | If true: debug auth exposed (404 when safe) |
| `DEBUG_DIAG` | Must be unset/false | diag.ts, diag/supabase | If true: diag exposed (404 when safe) |
| `ENABLE_DIAG_ROUTES` | Must be unset/false | diag.ts, debug.ts | If true: debug + diag enabled in prod |
| `ALLOW_DEBUG_HOSTS` | Optional | debug.ts | When set in prod, only these hosts get debug/diag |

---

## Cloudflare Workers environment variables

1. Open **Cloudflare Dashboard** → **Workers & Pages** → select your Worker (e.g. `aistroyka-web`).
2. **Settings** → **Variables and Secrets**.
3. Add each variable:
   - **Variable** = name (e.g. `NEXT_PUBLIC_SUPABASE_URL`).
   - **Value** = value (or use **Encrypt** for secrets).
4. For **production**, set **Environment** to **Production** (or the env that serves production).
5. Repeat for **staging** if you use a separate Worker env.

**Copy-paste list (Production):**

```
NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_APP_URL=https://aistroyka.ai
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
REQUIRE_CRON_SECRET=true
CRON_SECRET=<generate-strong-secret>
NODE_ENV=production
OPENAI_API_KEY=<optional>
```

Do **not** set in production: `DEBUG_AUTH`, `DEBUG_DIAG`, `ENABLE_DIAG_ROUTES` (or set to empty/false).

---

## Verification commands

**1. Env validation (run from repo root; needs Node):**

```bash
cd /Users/alex/Projects/AISTROYKA
NODE_ENV=production node scripts/validate-release-env.mjs
```

**Expected (success):** Exit 0; output shows `verdict: PASS` or `PASS_WITH_WARNINGS`. No `FAIL` and no `forbiddenInProdSet` in production.

**2. After deploy — health (replace BASE with your production URL):**

```bash
curl -s -o /dev/null -w "%{http_code}" https://aistroyka.ai/api/health
```

**Expected:** `200`

```bash
curl -s https://aistroyka.ai/api/health | head -c 500
```

**Expected:** JSON with `"ok":true` and `"db":"ok"` when Supabase is configured.

---

## Operator checklist (environment)

- [ ] All CORE variables set in Cloudflare (production env).
- [ ] `REQUIRE_CRON_SECRET=true` and `CRON_SECRET` set for production.
- [ ] `DEBUG_AUTH`, `DEBUG_DIAG`, `ENABLE_DIAG_ROUTES` unset or false in production.
- [ ] Run `NODE_ENV=production node scripts/validate-release-env.mjs` and get PASS or PASS_WITH_WARNINGS.
- [ ] After deploy: `curl` `/api/health` returns 200 and body has `ok:true`.
