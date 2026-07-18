# Pilot Synthetic Dataset — Apply Decision

**Date:** 2026-07-03  
**Worktree:** `AISTROYKA-main-clean`  
**Script:** `scripts/pilot/setup_pilot_dataset.sh` / `setup_pilot_dataset.mjs`

---

## Default decision

| Question | Answer |
|----------|--------|
| **May operator run `--apply` now?** | **NO** |
| **Owner approval required?** | **YES** |

Do **not** run `setup_pilot_dataset.sh --apply` until owner explicitly confirms isolation strategy or accepts shared-database risk documented below.

---

## Current Supabase ref (observed)

| Item | Value |
|------|-------|
| Project ref | `vthfrxehrursfloevnlp` |
| Host | `vthfrxehrursfloevnlp.supabase.co` |
| Region | eu-central-1 (per project docs) |
| Active project name | **AISTROYKA** |

**Observed during dry-run:** local `.env.local` points at this ref.

---

## Staging isolated or shared?

| Layer | Classification | Evidence |
|-------|----------------|----------|
| **Web/API** | **Separate deploy** | `staging.aistroyka.ai` vs `aistroyka.ai` |
| **Supabase database** | **SHARED** (single live project) | Same ref used for staging + production web; no separate staging Supabase project in repo truth |
| **Pilot smoke tenant** | **Pre-existing** | Default `PILOT_TENANT_ID=6414f756-aa54-48f5-91e2-f852a7c1e837` in script |

**Conclusion:** Staging rehearsal hits **staging web** but dataset `--apply` writes to the **shared AISTROYKA Supabase project**. This is **not** an isolated staging database unless owner provisions a separate Supabase project.

---

## Script safety gates

| Gate | Behavior |
|------|----------|
| `PILOT_ALLOW_PRODUCTION=YES` | Required only when `SUPABASE_URL` host matches production **app** domain pattern |
| Supabase `*.supabase.co` URL | **Not blocked** by hostname guard — **apply can mutate live DB** |
| Dry-run default | **Safe** — no writes |
| Auth user creation | **Not performed** by script — emails must exist |
| Deletes / reset | **Not performed** by script |

---

## When `--apply` is allowed

### Path A — Owner confirms dedicated synthetic tenant (recommended minimum)

Owner **YES** for:

- Upserting pilot dataset rows into **owner.demo@example.com** tenant only
- Using new `PILOT_TENANT_ID` + `PILOT_PROJECT_ID` UUIDs (not default smoke tenant)
- Synthetic `@example.com` users already created
- Staging web verification only afterward

Operator must **not** set `PILOT_ALLOW_PRODUCTION=YES` unless owner explicitly documents isolated demo tenant on shared DB.

### Path B — Isolated staging Supabase project (ideal)

Owner provisions **separate** Supabase project for staging-only rehearsal.

- Point local env `NEXT_PUBLIC_SUPABASE_URL` at staging project
- Staging web must be configured to use that project (infra change — **out of scope** for this doc-only task)
- Then `--apply` is lower risk

### Path C — Shared DB with default smoke tenant (high risk)

Applying to default `6414f756-…` tenant affects **existing smoke/pilot data**.

**Default: NO-GO** unless owner accepts in writing.

---

## NO-GO conditions (do not apply)

1. Owner approval not recorded.
2. Synthetic users (`owner.demo@`, workers, managers, stakeholder) **not** created in Auth.
3. `PILOT_TENANT_ID` not confirmed — risk of writing wrong tenant.
4. Operator cannot articulate rollback plan.
5. Intent is production pilot or real client data.
6. `PILOT_ALLOW_PRODUCTION=YES` requested for convenience without isolation review.

---

## Rollback / reset plan

| Action | Method |
|--------|--------|
| Undo script upserts | Manual delete of rows by `id` in Supabase Table Editor **or** SQL under owner supervision |
| Wrong tenant touched | **Stop** — escalate; do not re-run apply |
| Stakeholder over-exposed | Revoke stakeholder in dashboard immediately |
| After rehearsal complete | Owner decision: keep synthetic rows or delete by known UUIDs |

**Document before apply:** table list + UUIDs from dry-run output saved in operator secure notes.

---

## Recommended operator sequence (when owner approves)

```bash
# 1. Dry-run (always)
export PILOT_TENANT_ID="[owner-demo-tenant-uuid]"
export PILOT_PROJECT_NAME="Demo Apartment Renovation — Eixample"
export PILOT_MANAGER_EMAIL=carlos.manager@example.com
export PILOT_WORKER_EMAIL=ivan.worker@example.com
export PILOT_STAKEHOLDER_EMAIL=sofia.client@example.com
bash scripts/pilot/setup_pilot_dataset.sh

# 2. Owner YES recorded → apply
bash scripts/pilot/setup_pilot_dataset.sh --apply

# 3. Verify
export BASE_URL=https://staging.aistroyka.ai
bash scripts/pilot/role_smoke.sh
```

---

## Owner approval record (fill when granted)

| Field | Value |
|-------|-------|
| Owner name | |
| Date | |
| Approved path | A / B / C |
| Target tenant_id | |
| Shared DB risk accepted | YES / NO |
| Signature / APPROVED | |

---

## Current status (2026-07-18)

| Item | Status |
|------|--------|
| `--apply` allowed | **NO** (default until owner signs below) |
| Owner approval | **PENDING** |
| Dry-run completed | **YES** |
| Synthetic users (A1–A8) | **READY** — tenant `e4a310a8-56c2-4e55-b82d-6c390a40cb09` |
| Recommended apply target | **That synthetic tenant only** — never default smoke `6414f756-…` |

---

## Related

- `PILOT_SYNTHETIC_USERS_STAGING_CHECKLIST.md`
- `PILOT_SYNTHETIC_DAY0_COMPLETION_CHECKLIST.md`
- `docs/pilot/P2_PILOT_DATASET_SETUP.md`
