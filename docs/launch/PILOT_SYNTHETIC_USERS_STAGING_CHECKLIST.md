# Pilot Synthetic Users — Staging Checklist

**Date:** 2026-07-03  
**Worktree:** `AISTROYKA-main-clean`  
**Environment:** **staging web only** — `https://staging.aistroyka.ai`  
**Type:** Synthetic `@example.com` users — **not real clients**

---

## Rules

1. **Do not** use real names, phones, or company emails.
2. **Do not** commit passwords — store in operator password manager only.
3. **Do not** run steps against `https://aistroyka.ai` (production web) for this rehearsal.
4. Passwords in this doc: **`[SET_IN_PASSWORD_MANAGER]`** placeholder only.
5. After each user: record **user UUID** in local secure notes (not git).

---

## Synthetic user roster

| Role | Email | Display name (synthetic) |
|------|-------|--------------------------|
| Owner / Admin | `owner.demo@example.com` | Demo Owner |
| Manager | `carlos.manager@example.com` | Demo Carlos Manager |
| Manager | `elena.manager@example.com` | Demo Elena Manager |
| Worker | `ivan.worker@example.com` | Demo Ivan Worker |
| Worker | `pavel.worker@example.com` | Demo Pavel Worker |
| Worker | `luis.worker@example.com` | Demo Luis Worker |
| Stakeholder | `sofia.client@example.com` | Demo Sofia Client |

**Project (intake):** Demo Apartment Renovation — Eixample  
**Company (intake):** Demo Reforma Barcelona SL

---

## Phase 1 — Create Auth users (Supabase Dashboard or staging signup)

### Option A — Staging signup (preferred for owner)

1. Open `https://staging.aistroyka.ai/en/register` (or `es/register`).
2. Register **`owner.demo@example.com`** with password `[SET_IN_PASSWORD_MANAGER]`.
3. Complete onboarding → creates contractor workspace (owner tenant).
4. Record **tenant_id** from dashboard URL or `GET /api/v1/me` (local notes only).

### Option B — Supabase Auth Admin (operator with service role)

1. Supabase Dashboard → Authentication → Users → **Add user**.
2. Create each email above; password `[SET_IN_PASSWORD_MANAGER]`; **Auto Confirm** = yes.
3. **Do not** export or commit user list with passwords.

Repeat for all 7 emails if not using invite-only flow.

---

## Phase 2 — Tenant membership (owner invites)

Sign in as **`owner.demo@example.com`** on **staging** dashboard.

| Email | Tenant role | Action |
|-------|-------------|--------|
| `carlos.manager@example.com` | admin or member | Team → Invite |
| `elena.manager@example.com` | admin or member | Team → Invite |
| `ivan.worker@example.com` | member (worker) | Team → Invite |
| `pavel.worker@example.com` | member (worker) | Team → Invite |
| `luis.worker@example.com` | member (worker) | Team → Invite |

Each invitee:

1. Opens invite link on staging.
2. Sets password if new user: `[SET_IN_PASSWORD_MANAGER]`.
3. Accepts invite → verify login to dashboard or mobile.

**Stakeholder** (`sofia.client@example.com`): use **project stakeholder invite**, not internal admin role (see Phase 4).

---

## Phase 3 — Verify login (staging)

For each account, verify **on staging only**:

```bash
# Operator machine — load gitignored .env.local; do not print tokens
export BASE_URL="https://staging.aistroyka.ai"
# Mint token via Supabase password grant for each user in turn (manual or script)
curl -sS "$BASE_URL/api/v1/me" -H "Authorization: Bearer [TOKEN]"
```

| User | Expected |
|------|----------|
| `owner.demo@example.com` | role `owner` |
| `carlos.manager@example.com` | role `admin` or `member` |
| `elena.manager@example.com` | role `admin` or `member` |
| `ivan.worker@example.com` | role `member` |
| `pavel.worker@example.com` | role `member` |
| `luis.worker@example.com` | role `member` |

Or run after env vars set:

```bash
export PILOT_MANAGER_EMAIL=carlos.manager@example.com
export PILOT_MANAGER_PASSWORD='[SET_IN_PASSWORD_MANAGER]'
export PILOT_WORKER_EMAIL=ivan.worker@example.com
export PILOT_WORKER_PASSWORD='[SET_IN_PASSWORD_MANAGER]'
export BASE_URL=https://staging.aistroyka.ai
bash scripts/pilot/role_smoke.sh
```

---

## Phase 4 — Project membership & stakeholder

After project exists (manual dashboard or dataset apply when approved):

1. Add managers + workers to project **Team / Members** with correct project roles.
2. Stakeholder invite:
   - Dashboard → Project → Stakeholders → Invite `sofia.client@example.com`
   - Role: `client_viewer` or `client_decision_maker`
   - Send invite link; accept on staging.
3. Verify stakeholder lands on **portal** (`/portal/...`), not full contractor finance.

---

## Phase 5 — Verification checklist

| # | Check | Done |
|---|-------|------|
| 1 | All 7 Auth users exist | ☐ |
| 2 | Owner tenant created on staging | ☐ |
| 3 | 5 internal invites accepted | ☐ |
| 4 | Stakeholder invite accepted | ☐ |
| 5 | Each user login succeeds on staging | ☐ |
| 6 | Worker denied manager approvals (403) | ☐ |
| 7 | User UUIDs recorded locally (not git) | ☐ |

---

## Phase 6 — Env for dataset script (local only, gitignored)

When users exist, operator may set in **local env** (never commit):

```bash
export PILOT_TENANT_ID="[tenant-uuid-from-owner-workspace]"
export PILOT_PROJECT_NAME="Demo Apartment Renovation — Eixample"
export PILOT_MANAGER_EMAIL=carlos.manager@example.com
export PILOT_WORKER_EMAIL=ivan.worker@example.com
export PILOT_STAKEHOLDER_EMAIL=sofia.client@example.com
```

See `PILOT_SYNTHETIC_DATASET_APPLY_DECISION.md` before `--apply`.

---

## Status (2026-07-18)

| Item | Status |
|------|--------|
| Preflight (auth existence) | **DONE** — 0/7 users in `auth.users` |
| Passwords available | **NO** — provisioning **STOPPED** |
| Synthetic users created | **NO** |
| Owner workspace on staging | **NOT STARTED** |
| This checklist complete | **OPEN** |

**Evidence:** `PILOT_SYNTHETIC_USERS_PROVISIONING_REPORT.md`

**Required before create:** export `SYNTHETIC_OWNER_PASSWORD`, `SYNTHETIC_MANAGER_PASSWORD`, `SYNTHETIC_WORKER_PASSWORD`, `SYNTHETIC_STAKEHOLDER_PASSWORD` (gitignored secrets only).

---

## Related

- `PILOT_SYNTHETIC_USERS_PROVISIONING_REPORT.md`
- `PILOT_SYNTHETIC_DATASET_APPLY_DECISION.md`
- `PILOT_SYNTHETIC_DAY0_COMPLETION_CHECKLIST.md`
- `PILOT_SYNTHETIC_DAY0_SETUP_REPORT.md`
