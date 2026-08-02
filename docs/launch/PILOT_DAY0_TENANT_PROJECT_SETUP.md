# Pilot Day 0 — Tenant / Project Setup

**Date:** 2026-07-03  
**Client:** **NOT ASSIGNED** (intake OPEN)  
**Production pilot tenant:** **NOT AUTHORIZED / NOT CREATED**

---

## Environment decision

| Environment | Action | Status |
|-------------|--------|--------|
| **Staging dry-run** | Platform smoke only | **DONE** — see `PILOT_DAY0_STAGING_DRY_RUN.md` |
| **Staging client tenant** | Create after intake | **NOT STARTED** |
| **Production pilot tenant** | Owner confirmation required | **NOT STARTED** |

**Owner question (blocks production):** Confirm dedicated production pilot tenant for named client — **YES/NO**?  
**Safe default:** Complete full setup on **staging** first after intake filled.

---

## What was verified (existing smoke tenant)

Dry-run used gitignored smoke credentials (`.env.pilot`) against **existing** staging workspace — **not** a new client tenant.

| Item | Status |
|------|--------|
| Auth user can access staging API | Verified via chain |
| Projects visible to smoke user | Yes |
| Report create on staging | Yes |
| New tenant for client | **Not created** |

**Do not** reuse smoke tenant for real client data without owner approval.

---

## Operator steps when client intake complete

### Staging (first)

1. Owner/sponsor registers at `https://staging.aistroyka.ai/{locale}/register` **OR** operator creates users via invite flow.
2. Record tenant UUID in secure sheet (not git).
3. Create project per `P4_PROJECT_SETUP_RUNBOOK.md`.
4. Add 5–15 tasks; assign workers.
5. Optional: `node scripts/smoke/seed_pilot_project.mjs` with `PILOT_TENANT_ID`, `SMOKE_EMAIL` for membership assist.
6. Re-run smokes with **client** credentials:

```bash
set -a && source .env.pilot && source apps/web/.env.local && set +a
export BASE_URL="https://staging.aistroyka.ai"
export SMOKE_EMAIL="<client-manager@...>"
export SMOKE_PASSWORD="<secure>"
bash scripts/smoke/pilot_launch.sh
bash scripts/smoke/ios_mobile_api_chain.sh
```

### Production (after owner YES + staging PASS)

1. Owner confirms: **isolated production pilot tenant** for this client only.
2. Repeat provisioning on `https://aistroyka.ai` with real project names.
3. **No** unrelated customer data; **no** bulk service-role seeds without review.
4. Verify health `buildStamp.sha7` matches expected deploy.

---

## Rollback

- Staging: disable test users in Supabase Auth if mistake.
- Production: **escalate L3** before delete; prefer revoke invites over data purge.

---

## Day 0 verdict

| Question | Answer |
|----------|--------|
| Client tenant created | **NO** |
| Client project created | **NO** |
| Blocker | Intake + owner production authorization |
