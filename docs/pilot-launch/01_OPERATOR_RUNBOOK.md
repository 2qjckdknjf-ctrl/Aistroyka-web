# Operator runbook — pilot launch

**Purpose:** Execute pilot launch in order with minimal ambiguity.  
**Prerequisites:** Repo on branch `release/pilot-launch-pack` (or later); build and tests passing.

---

## 1. Cloudflare / host env setup

**Purpose:** App and cron need correct env in production.

**Variables to set (Cloudflare Dashboard → Workers & Pages → your worker → Settings → Variables and Secrets):**

| Variable | Required | Value / note |
|----------|----------|--------------|
| NEXT_PUBLIC_SUPABASE_URL | Yes | e.g. https://xxx.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Yes | From Supabase project API |
| NEXT_PUBLIC_APP_URL | Yes | e.g. https://aistroyka.ai (no trailing slash) |
| SUPABASE_SERVICE_ROLE_KEY | Yes | From Supabase project API (service_role) |
| NODE_ENV | Yes | production |
| REQUIRE_CRON_SECRET | Yes | true |
| CRON_SECRET | Yes | Long random string (e.g. `openssl rand -hex 32`) |
| OPENAI_API_KEY | If using AI | From OpenAI |
| STRIPE_SECRET_KEY | If using billing | From Stripe |
| STRIPE_WEBHOOK_SECRET | If using billing | From Stripe webhook |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | If using billing | From Stripe |

**Do not set in production:** DEBUG_AUTH, DEBUG_DIAG, ENABLE_DIAG_ROUTES (or set ALLOW_DEBUG_HOSTS only if you need debug on one internal host).

**Command to verify (after deploy):**  
Run with production vars loaded, from repo root:
```bash
NODE_ENV=production node scripts/validate-release-env.mjs
```
**Expected:** Exit 0; verdict PASS or PASS_WITH_WARNINGS.  
**Verify success:** Reports in `reports/release-hardening/env-validation-report.md`.

---

## 2. Supabase setup

**Purpose:** DB and auth for app; migrations and storage.

**Steps:**
1. **Migrations:** Apply in order (see DB_MIGRATION_APPLY_SEQUENCE.md). Use Supabase Dashboard → SQL Editor or `supabase db push` / your migration runner.
2. **Auth URLs:** In Supabase Dashboard → Authentication → URL Configuration, set Site URL and Redirect URLs to your NEXT_PUBLIC_APP_URL (e.g. https://aistroyka.ai, https://aistroyka.ai/**).
3. **Storage:** Create bucket `media` and policies (see SUPABASE_MEDIA_BUCKET_SETUP.md).

**Verify success:**  
- Migrations: No failed migrations; table `processed_stripe_events` exists if you applied 20260306900000.  
- Auth: Login from app redirects back to app.  
- Storage: Create upload session from app, upload file to path returned, finalize → 200.

---

## 3. Cron setup

**Purpose:** Jobs and upload_reconcile run on schedule.

**Steps:**
1. Ensure worker has REQUIRE_CRON_SECRET=true and CRON_SECRET set (see §1).
2. Use either:
   - **Option A:** Separate scheduled Worker that POSTs to `https://YOUR_APP/api/v1/admin/jobs/cron-tick` with header `x-cron-secret: YOUR_CRON_SECRET` on schedule `*/5 * * * *` (every 5 min). See CLOUDFLARE_CRON_TRIGGER_EXAMPLES.md.
   - **Option B:** External scheduler (e.g. cron job, GitHub Actions) that runs:
     ```bash
     curl -X POST -H "x-cron-secret: $CRON_SECRET" "https://YOUR_APP/api/v1/admin/jobs/cron-tick"
     ```

**Verify success:**
```bash
curl -sS -X POST -H "x-cron-secret: YOUR_CRON_SECRET" "https://YOUR_APP/api/v1/admin/jobs/cron-tick"
```
**Expected:** HTTP 200, body `{"ok":true,"scheduled":N,"processed":N,"tenants":N}`.

---

## 4. Storage setup

**Purpose:** Media uploads and finalize work.

**Steps:** See SUPABASE_MEDIA_BUCKET_SETUP.md. Create bucket `media`, add INSERT and SELECT policies with tenant check.

**Verify success:** From app: create upload session → upload file to returned path → finalize; then load media URL as same-tenant user → 200. Other-tenant → 403.

---

## 5. Stripe setup (if using billing)

**Purpose:** Checkout, portal, webhooks.

**Steps:**
1. Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in worker env.
2. In Stripe Dashboard → Webhooks, add endpoint `https://YOUR_APP/api/v1/billing/webhook`, select events (e.g. checkout.session.completed, customer.subscription.updated, customer.subscription.created), copy signing secret into STRIPE_WEBHOOK_SECRET.

**Verify success:** Trigger test event from Stripe; endpoint returns 200. Duplicate event returns 200 (idempotent).

---

## 6. AI setup (if using AI)

**Purpose:** Vision analysis and AI features.

**Steps:** Set at least one of OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY / GEMINI_API_KEY in worker env.

**Verify success:** From app, trigger an analysis (upload media and run analysis); no 503 from missing key.

---

## 7. Monitoring setup

**Purpose:** Know when health or cron fails.

**Steps:** See MONITORING_SETUP_PACK.md and ALERTING_EXECUTION_PACK.md. At minimum: external HTTP check to GET https://YOUR_APP/api/health every 5 min; alert on non-200 or body.ok !== true. Optional: check cron-tick 2xx if you have a way to send the secret.

**Verify success:** Simulate failure (e.g. wrong URL); alert fires (or log visible).

---

## 8. GO / NO-GO before pilot

Run through 02_PILOT_LAUNCH_CHECKLIST.md. All “Must have” items must be done. Then run:

```bash
PILOT_BASE_URL=https://YOUR_APP CRON_SECRET=your_secret node scripts/pilot-go-live-check.mjs
```

**GO** if script reports PASS (or PASS_WITH_WARNINGS with accepted optional gaps).  
**NO-GO** if FAIL or critical item unchecked; fix and re-run.
