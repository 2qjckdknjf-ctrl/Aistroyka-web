# Cloudflare env matrix — copy-paste checklist

**Where to set:** Cloudflare Dashboard → Workers & Pages → [your worker] → Settings → **Variables and Secrets**.

Use **Variables** for non-secret values; **Encrypted** (Secrets) for keys and secrets.

---

## Required (app will 503 or fail without these)

| Variable | Required | Where used | What breaks if missing |
|----------|----------|------------|-------------------------|
| NEXT_PUBLIC_SUPABASE_URL | Yes | Auth, DB, client | Login/API fail |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Yes | Auth, DB, client | Login/API fail |
| NEXT_PUBLIC_APP_URL | Yes | Auth redirects, links | Redirect/callback wrong |
| SUPABASE_SERVICE_ROLE_KEY | Yes | Jobs, admin, cron-tick | Cron-tick 503, jobs not run |
| NODE_ENV | Yes | production | Debug/env logic wrong |
| REQUIRE_CRON_SECRET | Yes | true | Cron unprotected if false |
| CRON_SECRET | Yes | Cron-tick, jobs/process | Cron-tick 403/503 |

---

## Optional — AI (at least one for AI features)

| Variable | Required | Where used | What breaks if missing |
|----------|----------|------------|-------------------------|
| OPENAI_API_KEY | If using OpenAI | Vision analysis | AI 503 |
| ANTHROPIC_API_KEY | If using Anthropic | Vision fallback | — |
| GOOGLE_AI_API_KEY / GEMINI_API_KEY | If using Gemini | Vision fallback | — |
| AI_ANALYSIS_URL | No | Override in-app URL | Defaults to app + /api/ai/analyze-image |

---

## Optional — Billing

| Variable | Required | Where used | What breaks if missing |
|----------|----------|------------|-------------------------|
| STRIPE_SECRET_KEY | If using Stripe | Checkout, portal | Billing 503 |
| STRIPE_WEBHOOK_SECRET | If using Stripe | Webhook verification | Webhook 400 |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | If using Stripe | Client checkout | Client cannot load Stripe |

---

## Optional — Push

| Variable | Required | Where used | What breaks if missing |
|----------|----------|------------|-------------------------|
| FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY | If using FCM | Android push | Push not sent |
| APNS_KEY, APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID | If using APNS | iOS push | Push not sent |

---

## Forbidden in production

| Variable | Set to | What if set wrong |
|----------|--------|-------------------|
| DEBUG_AUTH | unset or false | /api/_debug/auth may expose session info |
| DEBUG_DIAG | unset or false | /api/diag/supabase may expose connectivity |
| ENABLE_DIAG_ROUTES | unset or false | Same as above |
| ALLOW_DEBUG_HOSTS | empty or internal host only | If set to public host, debug routes allowed for that host |

---

## Copy-paste list (names only — set values in dashboard)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL
SUPABASE_SERVICE_ROLE_KEY
NODE_ENV
REQUIRE_CRON_SECRET
CRON_SECRET
OPENAI_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

Secrets (mark as Encrypted): SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET, OPENAI_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, FCM_*, APNS_*.
