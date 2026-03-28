# Wave 3 — Final operator capability check

**Date (UTC):** 2026-03-28

## What this environment can do directly

| Capability | Result |
|------------|--------|
| `gh` authenticated to `2qjckdknjf-ctrl` | **Yes** (scopes: `gist`, `read:org`, `repo`, `workflow`) |
| List repo Actions secrets (names) | **Yes** |
| **`gh secret set PILOT_SMOKE_BEARER_PRODUCTION`** | **Yes** (executed successfully) |
| `gh workflow run deploy-cloudflare-prod.yml` | **Yes** |
| Read `apps/web/.env.local` (gitignored) | **Yes** — used for Supabase password grant + live API curls only; values not written into docs |
| Live HTTPS to `https://www.aistroyka.ai` | **Yes** |
| Create second Auth user + `tenant_members` row as worker | **No** — no `SUPABASE_SERVICE_ROLE_KEY` (or equivalent) in local env name list |

## What cannot be done directly

| Limit | Reason |
|-------|--------|
| Supabase Dashboard / SQL editor | No browser automation with logged-in project owner in this sprint |
| Create **second** real worker in same tenant without admin | Invite + accept requires **two** mailboxes and `tenant:invite` (or admin seeding) |
| Prove **peer-owned** report read denial | Requires **two** distinct `user_id` values with worker capability in same tenant and a report row owned by B |

## Credentials / paths already available

- `SMOKE_EMAIL` / `SMOKE_PASSWORD` — pilot user (worker path proven).
- `NEXT_PUBLIC_SUPABASE_*` — anon key + URL for password grant.
- `SUPABASE_ACCESS_TOKEN` — present (CLI-style; not used for admin user creation).

## Remaining capability gap (cross-worker)

**Exact blocker:** A **second** tenant-scoped worker identity is not available in this environment without **external** operator action (invite + signup, or Supabase service-role seeding, or dashboard SQL).
