# Wave 3 — Live target readiness

**Date:** 2026-03-28  
**Authority:** `docs/ENVIRONMENT-VARIABLES.md`, `docs/launch/STAGE4_BLOCKER_RESOLUTION_AUTH_AND_PILOT_PREP.md`, `scripts/smoke/pilot_launch.sh`.

---

## Target environment

| Item | Value |
|------|--------|
| **Canonical app URL** | `NEXT_PUBLIC_APP_URL` / `BASE_URL` — production pilot uses **`https://aistroyka.ai`** (documented in env docs). |
| **Supabase** | Same project as Vercel: `NEXT_PUBLIC_SUPABASE_URL` + anon key (never commit secrets). |
| **Staging vs production** | Repo docs describe **Vercel Production + Preview**; **no separate staging URL** is committed as canonical. **Preview deployments** are the safer substitute for destructive tests when a PR exists. |

---

## Verification path selected

1. **Primary:** `BASE_URL=https://aistroyka.ai` + `scripts/smoke/pilot_launch.sh` (health, config, cron-tick, **ops/metrics** with auth).
2. **Authenticated API checks:** Supabase password grant (`SMOKE_EMAIL` / `SMOKE_PASSWORD`) + `Authorization: Bearer <access_token>` — **must** use `curl --location-trusted` (or a fixed canonical host) so **apex ↔ www** redirects do not drop `Authorization` (see `STAGE4_BLOCKER_RESOLUTION_AUTH_AND_PILOT_PREP.md`).

---

## Credentials / access method (operator)

| Secret / input | Source |
|----------------|--------|
| `SMOKE_EMAIL`, `SMOKE_PASSWORD` | Operator-owned; may live in **root** `.env.local` and/or `apps/web/.env.local` (gitignored). |
| `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` | Must match deployment. |
| `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Prefer `SUPABASE_ANON_KEY` first** when both present — `pilot_launch.sh` resolves this order; mismatch causes token/project skew and **401** on `ops/metrics`. |
| Second worker / cross-tenant negative tests | **Not** in repo as fixed credentials; requires operator provisioning or test DB. |

---

## `pilot_launch.sh` usability

- **Usable as-is** when `BASE_URL` is set and either `AUTH_HEADER` / `COOKIE` or password grant env vars are set per script header.
- **Cron:** Production returned **200** without `CRON_SECRET` in this session; if server requires secret, set `CRON_SECRET` per `PHASE1` docs.

---

## Blockers

| Blocker | Impact |
|---------|--------|
| **No committed staging-only URL** | “Staging” verification must be **Preview URL** or operator-specified; not a repo blocker. |
| **Second worker identity** | Cross-worker negative path **cannot** be proven without a second Supabase user + tenant membership. |
| **Deploy lag** | **Production** may run a build **older than** `main` — live behavior must be re-checked after deploy (see live reports). |

---

**Status:** **READY** for operator-led live verification (credentials + curl discipline); **NOT** self-closing without deploy + evidence.
