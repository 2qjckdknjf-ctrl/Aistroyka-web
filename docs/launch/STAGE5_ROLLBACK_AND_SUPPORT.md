# STAGE 5 — Rollback + first-client support (draft)

**Status:** **DRAFT — NOT FINAL.** Draft until STAGE 4 closes. **Do not** execute under NO-GO without leadership approval.

## Rollback (web)

- Revert offending Vercel deployment to **previous production deployment** in Vercel Dashboard (instant rollback).
- If database migrations were applied: follow `docs/release/PHASE3_ROLLBACK_RUNBOOK.md` and **do not** run destructive SQL without DBA sign-off.

## Rollback (mobile)

- Prior **store** build remains live until new version approved — **no** instant rollback for App Store / Play; communicate known issues and ship hotfix.

## First-client support playbook (outline)

1. **Triage channel** — single owner for pilot week; log issues with **timestamp**, **user**, **surface** (Android Worker / iOS Manager / web).
2. **Auth issues** — verify Supabase user + `tenant_members`; check `x-client` header matches app profile.
3. **Upload / media** — check upload-session + finalize routes; storage CORS/signing.
4. **Manager review** — confirm report ID in DB and PATCH review payload matches API contract.
5. **Escalation** — P0: data loss, auth bypass, billing incorrect; route per internal on-call.

## Smoke re-check

```bash
export BASE_URL=https://aistroyka.ai
# + authenticated env — see STAGE4_BLOCKER_RESOLUTION_AUTH_AND_PILOT_PREP.md
./scripts/smoke/pilot_launch.sh
```
