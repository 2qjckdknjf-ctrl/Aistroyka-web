# Phase 3 / A2 — Pilot Smoke Usage — AISTROYKA

**Date:** 2026-03-18

---

## 1. Automatic gate (GitHub Actions)

After each successful **deploy** job, workflows call `.github/workflows/pilot-smoke.yml`:

| Deploy workflow | BASE_URL | Bearer secret (repository) |
|-----------------|----------|----------------------------|
| `deploy-cloudflare-staging.yml` | `https://staging.aistroyka.ai` | `PILOT_SMOKE_BEARER_STAGING` |
| `deploy-cloudflare-prod.yml` | `https://aistroyka.ai` | `PILOT_SMOKE_BEARER_PRODUCTION` |

**Required repository secrets**

| Secret | Purpose |
|--------|---------|
| `PILOT_SMOKE_BEARER_STAGING` | Supabase **access_token** (JWT only, no `Bearer ` prefix) for a user that belongs to a tenant on **staging** |
| `PILOT_SMOKE_BEARER_PRODUCTION` | Same for **production** |

**Optional**

| Secret | When |
|--------|------|
| `CRON_SECRET` | Passed as `x-cron-secret` when production/staging has `REQUIRE_CRON_SECRET=true` |

If bearer secrets are missing or empty, the smoke job fails with a clear error. **No secret values are echoed** in logs.

---

## 2. Manual / operator command

```bash
BASE_URL=https://aistroyka.ai npm run smoke:pilot
```

Or: `bash scripts/smoke/pilot_launch.sh`

Same env vars as before: `BASE_URL`, optional `CRON_SECRET`, `AUTH_HEADER` or `COOKIE` or `SMOKE_EMAIL`/`SMOKE_PASSWORD` for ops/metrics.

---

## 3. Endpoints checked

| Endpoint | Method | Auth |
|----------|--------|------|
| /api/v1/health | GET | None |
| /api/v1/config | GET | None |
| /api/v1/admin/jobs/cron-tick | POST | x-cron-secret if configured |
| /api/v1/ops/metrics | GET | Bearer (CI: from secrets; manual: AUTH_HEADER) |

---

## 4. Obtaining a JWT for CI secrets

Use a dedicated pilot/service user with tenant membership. Example (run locally, **do not commit**):

1. Password grant or dashboard session → copy `access_token` from Supabase Auth.
2. Store **only the JWT string** in `PILOT_SMOKE_BEARER_STAGING` / `_PRODUCTION`.
3. Rotate if the user password changes or token expires (short-lived tokens may require periodic refresh — prefer long-lived service user or refresh automation outside this doc).

---

## 5. On failure

| Automatic (CI) | Action |
|----------------|--------|
| Smoke fails after deploy | App may already be live; fix endpoint or secrets, re-run failed job or push empty commit after fix |
| Bearer empty | Add or fix repository secrets |

| Manual | Action |
|--------|--------|
| ops/metrics 401/403 | Set `AUTH_HEADER` or credentials per §2 |

---

## 6. Script locations

- `scripts/smoke/pilot_launch.sh`
- `scripts/release/smoke-gate.sh` → same script
- `npm run smoke:pilot`
