# Pilot Synthetic Users — Provisioning Report (A1–A10)

**Timestamp:** 2026-07-18  
**Worktree:** `/Users/alex/Projects/AISTROYKA-main-clean`  
**Branch:** `post-merge-pr180` @ `4a78f851`  
**Supabase project:** `vthfrxehrursfloevnlp` (shared AISTROYKA — not isolated staging DB)  
**Staging web:** `https://staging.aistroyka.ai`

---

## Preflight

| Check | Result |
|-------|--------|
| Service-role credentials available | **YES** (local `.env.local`) |
| Passwords for 7 synthetic users available | **NO** |
| Auth users already exist (7 emails) | **NO** (0 rows) |
| Matching account/tenant/member rows | **NO** |
| Email collision with non-synthetic data | **NO** |
| Product code changed | **NO** |
| Dataset applied | **NO** |

---

## STOP — missing secret inputs

Per mission rule: **do not invent passwords; stop before creating users**.

Operator must provide passwords via one of:

1. Shell environment (preferred for this session), **or**
2. Gitignored local secrets file (e.g. `local-secrets/synthetic-pilot-users.env`), **or**
3. Password manager export into the shell only

### Exact missing inputs

| Env var | Used for |
|---------|----------|
| `SYNTHETIC_OWNER_PASSWORD` | `owner.demo@example.com` |
| `SYNTHETIC_MANAGER_PASSWORD` | `carlos.manager@example.com`, `elena.manager@example.com` (shared manager password OK) |
| `SYNTHETIC_WORKER_PASSWORD` | `ivan.worker@example.com`, `pavel.worker@example.com`, `luis.worker@example.com` (shared worker password OK) |
| `SYNTHETIC_STAKEHOLDER_PASSWORD` | `sofia.client@example.com` |

Optional aliases also accepted if present: `PILOT_OWNER_PASSWORD`, `PILOT_MANAGER_PASSWORD`, `PILOT_WORKER_PASSWORD`, `PILOT_STAKEHOLDER_PASSWORD`.

**Never** use placeholder strings such as `[SET_IN_PASSWORD_MANAGER]` as real passwords.

### Suggested local secrets file (gitignored)

```bash
# local-secrets/synthetic-pilot-users.env  (DO NOT COMMIT)
export SYNTHETIC_OWNER_PASSWORD='...'
export SYNTHETIC_MANAGER_PASSWORD='...'
export SYNTHETIC_WORKER_PASSWORD='...'
export SYNTHETIC_STAKEHOLDER_PASSWORD='...'
```

Then:

```bash
set -a && source local-secrets/synthetic-pilot-users.env && set +a
# re-run provisioning agent / script
```

---

## A1–A10 results

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| A1 | `owner.demo@example.com` exists | **NO** | `auth.users` query empty |
| A2 | `carlos.manager@example.com` exists | **NO** | same |
| A3 | `elena.manager@example.com` exists | **NO** | same |
| A4 | `ivan.worker@example.com` exists | **NO** | same |
| A5 | `pavel.worker@example.com` exists | **NO** | same |
| A6 | `luis.worker@example.com` exists | **NO** | same |
| A7 | `sofia.client@example.com` exists | **NO** | same |
| A8 | Tenant roles assigned | **NO** | no membership rows |
| A9 | Project memberships | **NOT CREATED** | intentionally out of scope until dataset |
| A10 | Stakeholder `project_stakeholders` | **NOT CREATED** | requires project — dataset gate |

**A1–A10 complete:** **NO**

---

## Per-user status

| Email | Auth exists | Assigned role | Account membership | Tenant membership | Project membership | Validation |
|-------|-------------|---------------|--------------------|-------------------|--------------------|------------|
| `owner.demo@example.com` | NO | — | — | — | NOT CREATED | BLOCKED |
| `carlos.manager@example.com` | NO | — | — | — | NOT CREATED | BLOCKED |
| `elena.manager@example.com` | NO | — | — | — | NOT CREATED | BLOCKED |
| `ivan.worker@example.com` | NO | — | — | — | NOT CREATED | BLOCKED |
| `pavel.worker@example.com` | NO | — | — | — | NOT CREATED | BLOCKED |
| `luis.worker@example.com` | NO | — | — | — | NOT CREATED | BLOCKED |
| `sofia.client@example.com` | NO | — | — | — | NOT CREATED | BLOCKED |

---

## Safety gates (unchanged)

| Gate | Value |
|------|-------|
| REAL_DATA_CHANGED | **NO** |
| PASSWORDS_COMMITTED | **NO** |
| PLATFORM_OWNER_GRANTS_CREATED | **NO** |
| DATASET_APPLIED | **NO** |
| APPLY_ALLOWED | **NO** (owner approval still required) |

---

## Planned role model (when passwords available)

Derived from `TenantRoleDb` / account layer (no schema invent):

| Email | Auth | Tenant role | Account role | Notes |
|-------|------|-------------|--------------|-------|
| `owner.demo@example.com` | create + confirm | `owner` | `owner` on contractor account | Create via workspace/signup or Admin API + `createContractorWorkspace` path |
| `carlos.manager@example.com` | create + confirm | `admin` or `member` | sync via invite accept | Manager |
| `elena.manager@example.com` | create + confirm | `admin` or `member` | sync via invite accept | Manager |
| `ivan.worker@example.com` | create + confirm | `member` | sync | Worker |
| `pavel.worker@example.com` | create + confirm | `member` | sync | Worker |
| `luis.worker@example.com` | create + confirm | `member` | sync | Worker |
| `sofia.client@example.com` | create + confirm | `stakeholder` (or portal-only via `project_stakeholders`) | **not** `account_members` | Client/stakeholder — restricted |

Synthetic company name when workspace created: **AISTROYKA Synthetic Pilot**.

Project memberships / `project_stakeholders` stay **NOT CREATED** until dataset owner approval (B1–B6).

---

## Commands run (read-only)

```text
git branch --show-current / rev-parse / status
env presence checks for SYNTHETIC_* / PILOT_* passwords (values not printed)
MCP execute_sql: auth.users lookup for 7 emails → []
MCP execute_sql: tenant_members / account_members join → []
MCP execute_sql: platform_owner_grants count (existing platform grant count = 1; no synthetic grants)
```

---

## Remaining blockers

1. **Missing passwords** for the four secret slots above.
2. After passwords: create Auth users + owner workspace + tenant memberships (A1–A8).
3. A9–A10 remain deferred until dataset apply is owner-approved (no project rows in this phase).

---

## Exact next safe action

1. Owner/operator creates `local-secrets/synthetic-pilot-users.env` (gitignored) with the four password exports.
2. `set -a && source local-secrets/synthetic-pilot-users.env && set +a`
3. Re-run this provisioning mission — agent will create Auth users + memberships only (no dataset `--apply`).
