# External Setup Result — Executive Summary

**Date:** 2026-03-11  
**Branch:** ops/external-setup-attempt

---

## 1. Completed by Cursor

- **Supabase — Stripe idempotency:** Applied migration `stripe_webhook_idempotency`. Table `processed_stripe_events` exists with RLS (service_role only).
- **Supabase — Storage:** Created bucket `media` (private). Created policies `media_insert_tenant` and `media_select_tenant` on storage.objects for tenant-isolated insert/select.
- **Live validation:** Confirmed GET /api/health and GET /api/v1/health return 200 and ok:true. Confirmed GET /api/_debug/auth and GET /api/diag/supabase return 404.

---

## 2. Already present before Cursor

- **Production deployment:** App at https://aistroyka.ai is up; health shows db:ok, supabaseReachable, serviceRoleConfigured, openaiConfigured.
- **Debug/diag:** Not enabled in production (404 on _debug and diag).
- **Supabase project:** AISTROYKA (vthfrxehrursfloevnlp) ACTIVE_HEALTHY; URL and anon key available via MCP.

---

## 3. Blocked due to no access

- **Cloudflare:** No MCP plugin for Workers/Variables/Cron. No list or set of production env vars, no cron trigger creation, no deploy trigger.
- **Cron verification with secret:** CRON_SECRET not available in session; cron-tick with header not verified.

---

## 4. Still must be done manually

1. **Cloudflare production env:** In Dashboard → Worker → Variables and Secrets, confirm or set: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL, SUPABASE_SERVICE_ROLE_KEY, NODE_ENV=production, REQUIRE_CRON_SECRET=true, CRON_SECRET. Ensure DEBUG_AUTH, DEBUG_DIAG, ENABLE_DIAG_ROUTES are unset or false.
2. **Cron activation:** Configure Cron Trigger (or external scheduler) to POST to https://aistroyka.ai/api/v1/admin/jobs/cron-tick with header x-cron-secret: <CRON_SECRET>. See docs/pilot-ops/02_CRON_PRODUCTION_SETUP.md.
3. **Cron verification:** Run `PILOT_BASE_URL=https://aistroyka.ai CRON_SECRET=*** ./scripts/pilot-ready-check.sh` (or verify-prod-cron.sh) and confirm ALL GREEN or expected warnings.
4. **Optional:** Run storage upload and cross-tenant tests per docs/pilot-ops/03_SUPABASE_STORAGE_SETUP.md.

---

## 5. Final decision

**PILOT READY WITH MANUAL STEPS**

- Supabase side: Stripe migration and storage bucket + policies are in place. Live health and debug safety are verified.
- Cloudflare side: Env and cron cannot be verified or set from Cursor; operator must confirm env and enable cron, then run pilot-ready-check.
