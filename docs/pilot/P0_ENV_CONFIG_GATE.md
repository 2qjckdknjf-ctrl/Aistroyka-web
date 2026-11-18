# P0 — Env / Config Gate

**Date:** 2026-07-01  
**Script:** `scripts/release/check-env-config.sh`

---

## Modes

```bash
bash scripts/release/check-env-config.sh deploy-staging
bash scripts/release/check-env-config.sh deploy-production
bash scripts/release/check-env-config.sh migrations
bash scripts/release/check-env-config.sh pilot-smoke
```

Script uses `set -euo pipefail`; checks **presence/structure only**, never prints secret values.

---

## Required variables by mode

### deploy-staging / deploy-production

| Variable | Kind | Where |
|----------|------|-------|
| `CLOUDFLARE_API_TOKEN` | secret | GitHub Actions secret |
| `CLOUDFLARE_ACCOUNT_ID` | secret | GitHub Actions secret |
| `NEXT_PUBLIC_SUPABASE_URL` | config | workflow env / build |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | config | workflow env / build |
| `NEXT_PUBLIC_APP_URL` | config | workflow env / build |
| `NEXT_PUBLIC_APP_ENV` | config | workflow env / build |
| `PILOT_SMOKE_BEARER` | secret | GitHub Actions secret |

### migrations

| Variable | Kind |
|----------|------|
| `SUPABASE_ACCESS_TOKEN` | secret |
| `SUPABASE_PROJECT_REF` | secret (`vthfrxehrursfloevnlp`) |

### pilot-smoke

| Variable | Kind | Notes |
|----------|------|-------|
| `BASE_URL` | config | Must be `http(s)://…` when set |
| `SMOKE_EMAIL` / `SMOKE_PASSWORD` | secret | Local `.env.local` — mint JWT for ops/metrics |
| `CRON_SECRET` | secret | Required for cron-tick PASS on production |
| `PILOT_SMOKE_BEARER_*` | secret | CI alternative to password grant |

---

## Auto-checked vs operator/manual

| Checked by script | Operator/manual only |
|-------------------|----------------------|
| Env var presence in CI/local shell | Cloudflare Worker runtime secrets (`SYSTEM_API_KEY`, `CRON_SECRET`, service role) |
| `BASE_URL` format | Supabase dashboard backup/PITR |
| | Apple/Google store credentials (mobile MODE B) |
| | `GITHUB_REVIEWER_TOKEN` for protected merges |

---

## Local validation output (2026-07-01)

```text
bash scripts/release/check-env-config.sh pilot-smoke
→ passed (BASE_URL warning when unset — expected locally)

bash scripts/smoke/check_pilot_prereqs.sh --strict
→ metrics auth OK via SMOKE_EMAIL+PASSWORD
→ missing: E2E_EMAIL/PASSWORD, SUPABASE_ACCESS_TOKEN (CLI)
```

---

## Verdict

**PARTIAL** — script exists and passes repo-visible checks; full production deploy/migration modes require CI secrets or operator export. Not a P0 blocker if CI deploy chain is green.
