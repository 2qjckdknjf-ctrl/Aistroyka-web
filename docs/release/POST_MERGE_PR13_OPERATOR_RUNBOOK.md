# Post-merge PR #13 — operator runbook

Use after **PR #13** is merged to `main` and deploy workflows have run (or are about to). This is **not** a production go-live guarantee.

## 1. Confirm merge

1. On GitHub, confirm PR #13 is merged and note **`main` SHA**.
2. Watch **GitHub Actions**: staging/production deploy workflows (`deploy-cloudflare-staging.yml`, production workflow as configured).
3. **Health:** hit public health routes your ops use (e.g. app `/api/v1/health` or smoke script targets — see `scripts/smoke/pilot_launch.sh`).

## 2. Staging smoke

Requires valid **tenant** auth for `ops/metrics` (Supabase user JWT in `AUTH_HEADER`, or session `COOKIE`, or `SMOKE_EMAIL`/`SMOKE_PASSWORD` + Supabase URL/anon — see script comments).

```bash
cd /Users/alex/Projects/AISTROYKA
BASE_URL=https://staging.aistroyka.ai bash scripts/smoke/pilot_launch.sh
```

Optional: `CRON_SECRET` if your staging requires it for cron-tick.

## 3. Production smoke

Run **only** when operator intends to verify production and has credentials. **Do not** run destructive checks.

```bash
BASE_URL=https://aistroyka.ai bash scripts/smoke/pilot_launch.sh
```

Use `--location-trusted` / canonical host if apex→www redirect drops `Authorization` (documented in `pilot_launch.sh`).

## 4. E2E (Playwright pilot)

From repo root, with app reachable and **auth env** set:

```bash
export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:3000}"
export E2E_EMAIL="..."
export E2E_PASSWORD="..."
# Optional: E2E_USER_EMAIL, E2E_USER_PASSWORD, SMOKE_PASSWORD (see _helpers/auth.ts)
bun run --cwd apps/web e2e:pilot
```

**CI / staging:** workflow `.github/workflows/pilot-e2e-audit.yml` — secrets `PILOT_E2E_BASE_URL`, `PILOT_E2E_EMAIL`, `PILOT_E2E_PASSWORD`, optional `PILOT_E2E_PROJECT_ID`, `E2E_LOCALE`.

## 5. Secrets / env (non-exhaustive)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL` — **build time** for OpenNext (`cf:build`).
- `SUPABASE_SERVICE_ROLE_KEY` — server-only (e.g. proof-pack share route); see `docs/ENVIRONMENT-VARIABLES.md`.
- Pilot smoke: per `scripts/smoke/pilot_launch.sh` and `.env.pilot.example`.

## 6. Where to record evidence

- `docs/audit/LIVE_SMOKE_FINAL_VERIFICATION.md` (create or append dated section)
- `docs/audit/FINAL_E2E_REPORT.md`
- `docs/product/PHASE13_ROADMAP_CLOSURE.md`

## 7. Roadmap closure rule

Do **not** change **FINAL ROADMAP STATUS** from **CONDITIONAL** to **CLOSED** in `PHASE13_ROADMAP_CLOSURE.md` until **credential-backed E2E** and **staging smoke** (at minimum) are actually green and documented.

## 8. Customer finance isolation

After merge, any new **portal / share / digest / Telegram / handover** change must be rechecked against `docs/security/FINAL_CUSTOMER_FINANCE_ISOLATION_AUDIT.md`. Owners/customers must never receive internal cost state.
