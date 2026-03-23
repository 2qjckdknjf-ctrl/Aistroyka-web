# Phase 3 — Runtime validation log

**Date:** 2026-03-23  
**Runner:** Founding Engineer (Paperclip task **AISAA-10**)  
**Targets:** Primary live checks against `https://aistroyka.ai`. Staging: not run (no approved `BASE_URL` in this session).

---

## 1. Repository migration sanity

**Command:**

```bash
cd /path/to/AISTROYKA && bash scripts/release/check-migrations.sh
```

**Result:** `Migration sanity check PASSED (62 migrations)`

**Migrations directory:** `apps/web/supabase/migrations/` (62 × `*.sql`, plus `.gitkeep` ignored by CLI).

---

## 2. Linked Supabase project (local CLI)

> **Note:** This uses whatever project the Supabase CLI is linked to from `apps/web` (developer machine). It is **not** automatically production or staging until the operator confirms `project_ref`.

**Commands:**

```bash
cd apps/web
supabase migration list
supabase db push --dry-run --yes
```

**Results:**

- `migration list`: all rows matched **except** the final migration — **Local** `20260323000000` | **Remote** *(empty)* | timestamp `2026-03-23 00:00:00`.
- `db push --dry-run`: `Would push these migrations:` • `20260323000000_project_members_owner_role.sql`

**Conclusion:** The linked remote database **has not applied** the latest repo migration.

**Production / staging repeat:** Run the same two commands with each environment’s linked ref or CI secrets; record outputs in a follow-up comment on **AISAA-10** or a child task.

---

## 3. Live HTTP checks (production)

All curls use **redirect follow** (`curl -L`) because the edge returns redirects on some paths.

### 3.1 Site root

```bash
curl -sS -L -o /dev/null -w "%{http_code}\n" --max-time 20 https://aistroyka.ai/
```

**Result:** `200`

### 3.2 Health

```bash
curl -sS -L -o /tmp/health.json -w "%{http_code}\n" --max-time 15 https://aistroyka.ai/api/v1/health
```

**Result:** HTTP **`503`**

**Body (abridged):** `ok:false`, `db:"error"`, `supabaseReachable:false`, `serviceRoleConfigured:true`, `reason` includes `infinite recursion detected in policy for relation "tenant_members"`.

### 3.3 Public config

```bash
curl -sS -L -o /dev/null -w "%{http_code}\n" --max-time 10 https://aistroyka.ai/api/v1/config
```

**Result:** `200`

### 3.4 Contact form (smoke-style)

```bash
curl -sS -L -o /dev/null -w "%{http_code}\n" --max-time 20 -X POST https://aistroyka.ai/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Phase3","email":"phase3-smoke@example.com","message":"Paperclip Phase3 runtime check"}'
```

**Result:** `200`

---

## 4. Documented full pilot smoke (not executed here)

**Script:** `scripts/smoke/pilot_launch.sh`  
**Workflow:** `.github/workflows/pilot-smoke.yml` (expects `BASE_URL`, `pilot_smoke_bearer`, optional `cron_secret`)

**Why not run end-to-end in this heartbeat:** Requires repository/user secrets (`PILOT_SMOKE_BEARER_*`, optional `CRON_SECRET`) and a tenant JWT. Unauthenticated subset was exercised via sections 3.2–3.4.

**Gap note:** `pilot_launch.sh` treats HTTP `503` as an acceptable status for health **and** passes if the response body contains the substring `"ok"` — which is true for `"ok":false`. Operators should tighten the check to require `"ok":true` (or parse JSON) if the intent is “healthy,” not merely “reachable.”

---

## 5. Env / secrets cross-check vs `docs/ENVIRONMENT-VARIABLES.md`

**Method:** Manual dashboard review (Production / Preview / staging projects).  
**Status in this run:** **Not executed** — no dashboard access from the agent environment.

**Suggested operator checklist:** For each required row in `docs/ENVIRONMENT-VARIABLES.md`, record: present / missing / wrong environment scope (without pasting values).
