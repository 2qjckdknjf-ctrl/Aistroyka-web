# STAGE 5 — Rollback + first-client support

**Status:** Operator playbook aligned to **Cloudflare** production. Named support owner/email still come from real intake (`PILOT_INTAKE_CARD.md` §7). **Not** a Day-0 GO.

**Contour:** iOS Worker + iOS Manager or web dashboard. Android is not the Day-0 field path (`docs/mobile/P3_ANDROID_DEFER_DECISION.md`).

## Rollback (web)

Canonical production is Cloudflare Workers (`aistroyka.ai`). Roll back by redeploying the previous successful **Deploy Cloudflare (Production)** GitHub Actions run, then confirm `GET /api/v1/health` → `buildStamp.sha7`. Do **not** use Vercel as production rollback.

If database migrations were applied: follow `docs/release/PHASE3_ROLLBACK_RUNBOOK.md` and **do not** run destructive SQL without DBA sign-off.

## Rollback (mobile)

Prior **TestFlight** build remains until a new build processes — **no** instant rollback for App Store / Play. Communicate known issues and ship a hotfix build.

## First-client support playbook (outline)

1. **Triage channel** — from intake `support.supportEmail` or WhatsApp/Telegram; log issues with **timestamp**, **user**, **surface** (iOS Worker / iOS Manager / web). Until intake is READY there is no named client channel.
2. **Auth issues** — verify Supabase user + `tenant_members`; check `x-client` header matches app profile (`ios_lite` vs manager).
3. **Upload / media** — check upload-session + finalize routes; storage CORS/signing.
4. **Manager review** — confirm report ID in DB and PATCH review payload matches API contract.
5. **Escalation** — P0: data loss, auth bypass, billing incorrect; route per internal on-call (assign before `launchAllowed: YES`).

## Smoke re-check

```bash
export BASE_URL=https://aistroyka.ai
# + authenticated env — see STAGE4_BLOCKER_RESOLUTION_AUTH_AND_PILOT_PREP.md
./scripts/smoke/pilot_launch.sh
```

Confirm `buildStamp.sha7` after any rollback.
