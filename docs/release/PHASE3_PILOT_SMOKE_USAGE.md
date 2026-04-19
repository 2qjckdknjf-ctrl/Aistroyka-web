# Phase 3 / A2 — Pilot Smoke Usage — AISTROYKA

**Date:** 2026-03-18

---

## 1. Automatic gate (GitHub Actions)

After each successful **deploy** job, workflows call `.github/workflows/pilot-smoke.yml`.

**Scheduled AI gate (staging):** `.github/workflows/ai-phase5-slo-schedule.yml` runs `scripts/smoke/ai_phase5_gate.sh` daily (06:00 UTC) and on manual dispatch, using the same staging secrets as the post-deploy `ai-phase5-gate` job.

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
| `PILOT_SMOKE_EMAIL_STAGING` / `PILOT_SMOKE_PASSWORD_STAGING` | With `NEXT_PUBLIC_SUPABASE_URL_STAGING` + `NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING`: fallback token mint for `pilot-smoke` and `ai_phase5_gate` |
| `PILOT_SMOKE_EMAIL_PRODUCTION` / `PILOT_SMOKE_PASSWORD_PRODUCTION` | Same pair for **production** (`NEXT_PUBLIC_SUPABASE_URL_PRODUCTION` + `NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION`) |
| `PILOT_SMOKE_PROJECT_ID_STAGING` | If set, overrides the staging pilot **project UUID** for **`ai-phase5-gate`** stream probe. If unset, defaults to the STAGE4 fixture `a0000003-0000-4000-8000-000000000001`. |
| `PILOT_SMOKE_PROJECT_ID_PRODUCTION` | If set, production post-deploy **`ai-phase5-gate`** also probes `POST /api/v1/projects/:id/copilot/chat/stream` (must be a project UUID visible to the smoke user in **production** DB). If unset, the gate still runs **`/api/v1/ai/analyze-image`** only. |

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
- `scripts/smoke/ai_phase5_gate.sh` — optional post-deploy probe (`analyze-image` + optional copilot stream); see `deploy-cloudflare-staging.yml` / `deploy-cloudflare-prod.yml` job `ai-phase5-gate`

## 7. AI Phase 5 gate (non-blocking)

After `pilot-smoke`, staging and production deploy workflows run **`ai-phase5-gate`** (`continue-on-error: true`). It uses the same bearer + optional smoke email/password + Supabase URL/anon key as `pilot-smoke.yml`, and prefers a **password-grant user JWT** when email/password are set (required for tenant-gated copilot stream).
