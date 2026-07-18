# Pilot Synthetic Users — Provisioning Report (A1–A10)

**Timestamp:** 2026-07-18  
**Worktree:** `/Users/alex/Projects/AISTROYKA-main-clean`  
**Branch:** `post-merge-pr180`  
**Supabase project:** `vthfrxehrursfloevnlp` (shared)  
**Staging web:** `https://staging.aistroyka.ai`  
**Synthetic company:** AISTROYKA Synthetic Pilot  

**Tenant ID:** `e4a310a8-56c2-4e55-b82d-6c390a40cb09`  
**Account ID:** `42d723f6-7008-428d-995a-469bd6cdb68c`

---

## Safety gates

| Gate | Value |
|------|-------|
| SECRET_FILE_CREATED | **YES** — `local-secrets/synthetic-pilot-users.env` |
| SECRET_FILE_GITIGNORED | **YES** |
| SECRET_FILE_MODE_600 | **YES** |
| SYNTHETIC_USERS_CREATED | **YES** (7/7) |
| USER_COLLISIONS | **NO** |
| REAL_DATA_CHANGED | **NO** |
| PASSWORDS_COMMITTED | **NO** |
| PLATFORM_OWNER_GRANTS_CREATED | **NO** |
| DATASET_APPLIED | **NO** |
| READY_FOR_DATASET_OWNER_APPROVAL | **YES** |

---

## A1–A10 results

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| A1 | `owner.demo@example.com` exists | **PASS** | Auth confirmed; tenant+account `owner` |
| A2 | `carlos.manager@example.com` exists | **PASS** | tenant/account `admin` |
| A3 | `elena.manager@example.com` exists | **PASS** | tenant/account `admin` |
| A4 | `ivan.worker@example.com` exists | **PASS** | tenant/account `member` |
| A5 | `pavel.worker@example.com` exists | **PASS** | tenant/account `member` |
| A6 | `luis.worker@example.com` exists | **PASS** | tenant/account `member` |
| A7 | `sofia.client@example.com` exists | **PASS** | tenant `stakeholder`; no `account_members` |
| A8 | Tenant roles assigned | **PASS** | all 7 on synthetic tenant |
| A9 | Project memberships | **NOT CREATED** | dataset gate — intentional |
| A10 | Stakeholder `project_stakeholders` | **NOT CREATED** | dataset gate — intentional |

**A1–A8 complete:** **YES**  
**A1–A10 complete (incl. project rows):** **NO** — A9/A10 deferred until owner-approved dataset apply

---

## Per-user status

| Email | Auth | Assigned role | Account membership | Tenant membership | Project membership | Validation |
|-------|------|---------------|--------------------|-------------------|--------------------|------------|
| `owner.demo@example.com` | YES `23aa5088…7cdd` | owner | owner (active) | owner | NOT CREATED | **PASS** |
| `carlos.manager@example.com` | YES `24d91946…e6b1` | admin (manager) | admin (active) | admin | NOT CREATED | **PASS** |
| `elena.manager@example.com` | YES `53357abb…ebef` | admin (manager) | admin (active) | admin | NOT CREATED | **PASS** |
| `ivan.worker@example.com` | YES `1c6be1d4…1189` | member (worker) | member (active) | member | NOT CREATED | **PASS** |
| `pavel.worker@example.com` | YES `780aea1c…a343` | member (worker) | member (active) | member | NOT CREATED | **PASS** |
| `luis.worker@example.com` | YES `ab876626…4a2f` | member (worker) | member (active) | member | NOT CREATED | **PASS** |
| `sofia.client@example.com` | YES `8e501713…6e57` | stakeholder | none (excluded) | stakeholder | NOT CREATED | **PASS** |

---

## Login / isolation smoke (staging)

| Check | Result |
|-------|--------|
| Owner `/api/v1/me` → owner | **PASS** |
| Carlos `/api/v1/me` → admin | **PASS** |
| Elena `/api/v1/me` → admin | **PASS** |
| Ivan/Pavel/Luis `/api/v1/me` → member | **PASS** |
| Sofia `/api/v1/me` → stakeholder | **PASS** |
| Sofia denied `/api/v1/approvals/pending` → 403 | **PASS** |
| Worker `/api/v1/approvals/pending` → 200 | **NOTE** — current product RBAC: `member` may review (`canReviewReport` → `member+`). Checklist 403 expectation does not match live policy. Not a provisioning defect. |
| No `platform_owner_grants` for synthetic users | **PASS** |

---

## Provisioning method

- Script: `scripts/pilot/provision_synthetic_users.mjs` (no secrets in file)
- Auth: Supabase Admin `createUser` + `email_confirm`
- Workspace: contractor `accounts` + `tenants` + owner memberships (mirrors `createContractorWorkspaceForUser`)
- Internal members: `tenant_members` + `account_members` sync (stakeholder excluded from account layer)
- Local id map (gitignored): `local-secrets/synthetic-pilot-users-ids.json`

---

## Remaining blockers

1. **A9–A10** — require project + `project_stakeholders` via owner-approved dataset apply (still **APPLY_ALLOWED=NO** until owner signs decision doc).
2. Dataset / B1–B6 / C1–C12 not started (hard stop).

---

## Exact next safe action

1. Owner reviews `PILOT_SYNTHETIC_DATASET_APPLY_DECISION.md`.
2. If Path A approved: set `PILOT_TENANT_ID=e4a310a8-56c2-4e55-b82d-6c390a40cb09` and run dry-run then `--apply` for **this synthetic tenant only**.
3. Do **not** apply to default smoke tenant `6414f756-…`.
