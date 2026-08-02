# P4 — Tenant / Account Setup Runbook

**Date:** 2026-07-03  
**Phase:** P4 Task B  
**Audience:** Operator (CS / ops). **Not a development task.**

---

## Safety rules

1. **Never commit** passwords, service-role keys, or pilot user credentials to git.
2. **Staging first:** dry-run full flow on `https://staging.aistroyka.ai` before production pilot tenant.
3. **Production pilot tenant:** use a **dedicated client tenant** — not shared demo/smoke tenants unless explicitly approved.
4. **Service-role scripts** (`SUPABASE_SERVICE_ROLE_KEY`) are **operator-only** on a trusted machine with `.env.local` loaded — not CI logs, not client hands.
5. **Rollback:** document tenant id + user ids; disable users via Supabase Auth dashboard if needed; do not delete production data without owner approval.

---

## 1. Choose environment

| Environment | Base URL | When to use |
|-------------|----------|-------------|
| **Staging pilot** | `https://staging.aistroyka.ai` | Day 0 dry-run, operator training, script validation |
| **Production pilot tenant** | `https://aistroyka.ai` (or `https://www.aistroyka.ai`) | Live client pilot after staging smoke PASS |

**Verify health:**

```bash
curl -sS "https://staging.aistroyka.ai/api/v1/health" | head -c 400
curl -sS "https://aistroyka.ai/api/v1/health" | head -c 400
```

Record `buildStamp.sha7` in operator log.

**Preflight (repo root):**

```bash
bun run smoke:pilot:check
# optional strict metrics auth:
bun run smoke:pilot:check -- --strict
```

---

## 2. Create / confirm tenant and account

### Recommended path — client owner self-signup (production)

1. Client sponsor opens `https://aistroyka.ai/{locale}/register` (or invite from owner).
2. Completes signup → onboarding creates **contractor workspace** (`accounts` + `tenants` + owner membership).
3. Owner verifies email and reaches dashboard.

### Operator-assisted path — existing user

If users already exist in Supabase Auth:

1. Confirm user in Supabase Dashboard → Authentication.
2. Attach to tenant via **dashboard invite** (preferred) or service-role attach (below).

**Service-role attach (idempotent, smoke/ops only):**

```bash
# From repo root; requires gitignored .env.local with SERVICE_ROLE
set -a && source .env.local && set +a
export SMOKE_EMAIL="manager@client.example.com"
export PILOT_TENANT_ID="<tenant-uuid>"   # optional; default in script is smoke tenant — OVERRIDE for real pilot
export PILOT_TENANT_ROLE="admin"         # admin | member | viewer
node scripts/smoke/attach_smoke_user_tenant.mjs
```

**Warning:** Default `PILOT_TENANT_ID` in script points at internal smoke tenant — **always set explicit tenant UUID** for real client pilot.

---

## 3. Create owner / admin

| Role | How | Dashboard path |
|------|-----|----------------|
| **Owner** | First signup on tenant | Automatic on workspace creation |
| **Admin** | Owner invites with role **admin** | Dashboard → Team → Invite |

**Verify:** Owner signs in → `/dashboard` loads → `GET /api/v1/me` returns tenant context (use browser devtools or operator JWT smoke).

---

## 4. Create managers

1. Owner opens **Team** → **Invite user**.
2. Email + role: **admin** or **member** (manager ops).
3. Recipient accepts invite link → sets password if new.
4. Repeat for each manager (minimum 1).

**Optional iOS Manager:** same credentials as web; TestFlight build **2026063001** (owner distributes via App Store Connect).

---

## 5. Create workers

1. Owner invites with role **member** (field worker).
2. Worker accepts invite.
3. Add to **project membership** (see project runbook) — workers see projects via `project_members`.

Minimum: **2 workers** for meaningful pilot.

---

## 6. Create stakeholder / client (portal)

1. Manager opens project → **Stakeholders** panel (`StakeholderManagerPanel`).
2. Invite stakeholder email with role:
   - `client_viewer` — read progress, photos, approved artifacts
   - `client_decision_maker` — can respond to client requests where enabled
3. Copy invite URL from UI (email automation may be manual) → send to client securely.
4. Stakeholder accepts → lands on **portal** routes (`/portal/...`).

**Finance isolation:** Stakeholder must **not** see internal costs, margin, or contractor budget pressure. Verify portal payload before kickoff (`docs/security/*` isolation audits).

---

## 7. Assign project memberships

For each worker and manager who must see the pilot project:

1. Dashboard → Project → **Team / Members**.
2. Add user with role `worker`, `manager`, or appropriate project role.
3. Or use idempotent seed script (operator, service role):

```bash
set -a && source .env.local && set +a
export SMOKE_EMAIL="worker@client.example.com"
export PILOT_TENANT_ID="<tenant-uuid>"
export PILOT_PROJECT_ID="<project-uuid>"   # optional fixed UUID
export PILOT_PROJECT_NAME="Client Pilot Site A"
node scripts/smoke/seed_pilot_project.mjs
```

Script creates/updates `projects` + `project_members` for the smoke email user only.

---

## 8. Verify tenant isolation

Operator checks (staging or prod):

- [ ] User A (tenant 1) cannot see tenant 2 projects (403/empty).
- [ ] Stakeholder sees **only** portal-safe project data.
- [ ] Suspended account fails closed (if testing account status).

**Smoke:**

```bash
set -a && source .env.local && set +a
export BASE_URL="https://staging.aistroyka.ai"
export SMOKE_EMAIL="<pilot-manager@client.com>"
export SMOKE_PASSWORD="<from secure store>"
bash scripts/smoke/pilot_launch.sh
```

---

## 9. Verify project visibility

Per role:

| Role | Expected |
|------|----------|
| Owner | All tenant projects |
| Manager | Assigned projects + reports inbox |
| Worker | `project_members` projects only; today's tasks |
| Stakeholder | Portal project view only |

**Mobile API chain (optional operator proof):**

```bash
set -a && source .env.pilot && source apps/web/.env.local && set +a
export BASE_URL="https://staging.aistroyka.ai"
bash scripts/smoke/ios_mobile_api_chain.sh
```

---

## 10. Record credentials securely

| Item | Store in | Never |
|------|----------|-------|
| Owner/manager/worker emails | CRM / password manager / secure sheet | Git, Slack public channels |
| Passwords | Client password manager or one-time share | Email plaintext long-term |
| Tenant ID, project IDs | Operator runbook copy | Public docs |
| TestFlight invite | ASC + client email | Repo |

**Template (secure sheet):**

```
Pilot: <company>
Environment: staging | production
Tenant ID:
Project ID:
Owner email:
Manager emails:
Worker emails:
Stakeholder emails:
TestFlight: build 2026063001
Support: <pilot-support@...>
Day 0 date:
```

---

## Rollback / reset

| Action | Steps |
|--------|-------|
| Revoke stakeholder | Dashboard → Stakeholders → Revoke |
| Remove user from tenant | Dashboard → Team → Remove (or Supabase tenant_members) |
| Disable login | Supabase Auth → disable user |
| Reset staging pilot | Use separate staging tenant; re-run seed scripts idempotently |
| Production mistake | **Stop** — escalate L3; no mass delete without owner |

---

## Scripts summary

| Script | Purpose |
|--------|---------|
| `scripts/smoke/pilot_launch.sh` | Health + config + metrics smoke |
| `scripts/smoke/attach_smoke_user_tenant.mjs` | Attach auth user to tenant (service role) |
| `scripts/smoke/seed_pilot_project.mjs` | Project + project_members for worker email |
| `scripts/smoke/ios_mobile_api_chain.sh` | Worker/manager API chain proof |
| `scripts/smoke/bootstrap_smoke_user.mjs` | **Internal smoke only** — creates smoke.manager@example.com |

**Note:** `scripts/pilot/setup_pilot_dataset.sh` is **not on this branch**. Use dashboard flows + scripts above until unified pilot dataset script is merged.

---

## Related docs

- `docs/pilot/PILOT_TENANT_READINESS.md`
- `docs/growth/PILOT_ROLLOUT_PLAYBOOK.md`
- `docs/launch/P4_PROJECT_SETUP_RUNBOOK.md`
- `docs/launch/STAGE4_BLOCKER_RESOLUTION_AUTH_AND_PILOT_PREP.md`
