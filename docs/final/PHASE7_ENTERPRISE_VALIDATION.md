# Phase 7 — Enterprise operations / production hardening (validation)

**Date:** 2026-03-23  
**Tracks:** [AISAA-15](/AISAA/issues/AISAA-15)

**Precondition:** Treat validation as **authoritative for production** only after [AISAA-11](/AISAA/issues/AISAA-11) is **done** (migration parity + RLS + green health). Until then, record results as **conditional / blocked**.

## 1. Public health (anon DB path)

```bash
curl -sS -o /tmp/health.json -w "%{http_code}" "$BASE_URL/api/v1/health"
```

Expect: **HTTP 200**, JSON `ok: true`, `db: "ok"`.

If **503** or `infinite recursion` / policy errors: stop — align with [PHASE3_REMEDIATION.md](./PHASE3_REMEDIATION.md) before other checks.

## 2. Build stamp correlation

Health body includes `buildStamp.sha7` when configured — compare to the commit deployed via Cloudflare / CI (see [PHASE7_ENTERPRISE_INVENTORY.md](./PHASE7_ENTERPRISE_INVENTORY.md) §1).

## 3. Migration parity

From operator workstation or GHA log pattern (see [docs/closure/A1_MIGRATION_APPLY_RUNBOOK.md](../closure/A1_MIGRATION_APPLY_RUNBOOK.md)):

- `supabase migration list` (linked project) — remote must include remedial files named in Phase 3 docs (e.g. `20260323000000_project_members_owner_role`, `20260323110000_tenant_members_rls_break_recursion`) **without** operator guesswork.

## 4. Post-deploy pilot smoke

As defined in [`.github/workflows/pilot-smoke.yml`](../../.github/workflows/pilot-smoke.yml):

- Prod deploy workflow must invoke reusable smoke with `https://aistroyka.ai` (or current canonical base).
- Secret `PILOT_SMOKE_BEARER_PRODUCTION` non-empty; `pilot_launch.sh` exits 0.

Local equivalent: [docs/release/PHASE3_PILOT_SMOKE_USAGE.md](../release/PHASE3_PILOT_SMOKE_USAGE.md).

## 5. Admin diagnostics (authenticated)

With a **tenant admin** session (JWT):

- `GET /api/v1/admin/ops/diagnostics?hours=24` — **200**, JSON shape matches route implementation (metrics + AI aggregate + failed jobs + hints).
- Confirm route is **not** reachable without admin (401/403 as implemented).

## 6. Ops overview / metrics (tenant ops role)

- `GET /api/v1/ops/overview` and `GET /api/v1/ops/metrics` with appropriate ops-capable user — confirm **no cross-tenant leakage** (spot-check tenant boundary; formal proof is RLS + app tests).

## 7. Env governance

- Run `NODE_ENV=production node scripts/validate-release-env.mjs` (see [docs/ENVIRONMENT-VARIABLES.md](../ENVIRONMENT-VARIABLES.md)).
- Confirm production secrets do **not** set `DEBUG_DIAG`, `ENABLE_DIAG_ROUTES`, `DEBUG_AUTH`.

## 8. CI contract sanity

- Confirm prod deploy workflow still runs `scripts/release/check-env-config.sh deploy-production` before build.
- Confirm `apply-migrations.yml` remains **manual** dispatch (no accidental auto-push).

## Validation record template

| Check | Environment | Result | Evidence (link/log) | Date |
|-------|-------------|--------|----------------------|------|
| Health | prod | pass/fail | | |
| Migrations | prod | pass/fail | | |
| Pilot smoke | CI | pass/fail | | |
| Admin diagnostics | prod/staging | pass/fail | | |
