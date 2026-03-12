# Rollback and recovery

**Purpose:** Restore service or revert deploy with minimal damage.

---

## Rollback triggers (when to roll back)

1. **Health down** — GET /api/health or /api/v1/health consistently non-200 or ok:false for >5–10 min.
2. **Auth broken** — Users cannot log in or session invalid; fix not obvious in <15 min.
3. **Data risk** — Suspected data corruption or wrong tenant data exposure; stop traffic immediately.
4. **Cron/config mistake** — Wrong CRON_SECRET or env caused 503/crash; revert deploy and fix env.

---

## Rollback steps (Cloudflare Workers)

1. **Revert deploy**
   - Cloudflare Dashboard → Workers & Pages → your worker → Deployments.
   - Find last known-good deployment → “Rollback” or “Restore”.
   - Or redeploy previous version from repo: `git checkout <previous-tag>` then `bun run cf:build && bun run cf:deploy` (or your deploy command).

2. **If env is wrong (no code change)**
   - Workers → Settings → Variables and Secrets.
   - Fix or remove incorrect vars; save. Worker restarts with new env.

3. **If cron is hammering**
   - Disable Cron Trigger or scheduled Worker that calls cron-tick until fixed.
   - Or temporarily set REQUIRE_CRON_SECRET=false and rotate CRON_SECRET later (not recommended long-term).

---

## Recovery after rollback

1. **Diagnose** — Check Workers logs, Supabase logs, and LOG_SEARCH_QUERIES.md for request_id, errors, cron_tick_error.
2. **Fix** — Code fix or config fix; test in staging if possible.
3. **Redeploy** — Deploy fixed version; re-run pilot-go-live-check.
4. **Re-enable cron** — Turn Cron Trigger back on when cron-tick is healthy.

---

## Database / Supabase

- **No automatic rollback of migrations** in this pack. If a migration caused an issue, fix forward (new migration) or restore from backup per Supabase procedures.
- **Stripe webhook idempotency** — Table `processed_stripe_events` is append-only. No rollback of table needed; duplicate events are ignored.

---

## Contacts and escalation

- Document on-call or escalation contact for your team.
- Keep link to FIRST_72H_OPERATIONS_CHECKLIST (docs/release-hardening) for first 24–72h after launch.
