# P0 — Step 13 Budget/Cost Live Verification

**Date:** 2026-07-01  
**Target migration:** `20260307500000_project_cost_items.sql`  
**Target Supabase:** AISTROYKA (`vthfrxehrursfloevnlp`, eu-central-1)

---

## D1 — Target environment

Canonical live DB per `docs/audit/LIVE_SUPABASE_SCHEMA_REPORT.md` — project **AISTROYKA**, not legacy `aistroyka-release1`.

---

## D2 — Migration status

Supabase MCP `list_migrations` includes:

```text
20260307500000 — project_cost_items
```

**Applied:** YES

---

## D3–D4 — Schema verification

Table `public.project_cost_items` exists with expected columns:

`id`, `tenant_id`, `project_id`, `category`, `title`, `planned_amount`, `actual_amount`, `currency`, `status`, `notes`, `milestone_id`, `created_by`, `created_at`, `updated_at`

RLS enabled (per prior audits).

---

## D5 — Runtime verification

Script: `apps/web/scripts/verify-cost-runtime.mjs`

```bash
set -a && source .env.local && set +a
export STEP13_VERIFY_EMAIL="$SMOKE_EMAIL"
export STEP13_VERIFY_PASSWORD="$SMOKE_PASSWORD"

BASE_URL=https://staging.aistroyka.ai node apps/web/scripts/verify-cost-runtime.mjs
BASE_URL=https://aistroyka.ai node apps/web/scripts/verify-cost-runtime.mjs
```

### Staging (2026-07-01)

- GET `/api/v1/projects/:id/costs` → OK  
- POST create → OK  
- PATCH update → OK  
- Summary totals updated → OK  
- **SUCCESS**

### Production (2026-07-01)

- GET costs → OK (existing items visible)  
- POST create → OK  
- PATCH update → OK  
- **SUCCESS**

---

## D6 — Manager UI path

Not re-verified in browser this pass. API layer closed under authenticated manager tenant member. UI verification deferred to P1/P2 role smoke unless owner requests explicit dashboard cost-tab check.

---

## Blockers

None for Step 13 API + migration live activation.

---

## Verdict

**FULL** — migration applied, schema present, runtime GET/POST/PATCH verified on **staging and production**.
