# Wave 3 — Cross-worker capability check

**Date (UTC):** 2026-03-28

## Direct actions possible

| Action | Result |
|--------|--------|
| `gh` / git push | Yes |
| **Supabase MCP `execute_sql`** on production Postgres | **Yes** — used for controlled seeding (auth user + tenant_members + worker_reports) |
| Password grant JWT for `SMOKE_EMAIL` | Yes (local `.env.local`) |
| Password grant for seeded Worker B | Yes after SQL seed (credentials not committed) |
| Live `curl` to `https://www.aistroyka.ai` | Yes |

## Direct actions not possible (without extra scope)

| Action | Reason |
|--------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` in local `.env.local` | Not present (only public + smoke vars listed) |
| `supabase link` / CLI migrations without project link | Project not linked in this workspace |

## Strongest viable path used

1. **Code:** Enforce **lite** (`ios_lite` / `android_lite`) peer isolation on **GET** `/api/v1/reports/:id` and **GET** `/api/v1/tasks/:id` so tenant `member` field workers do not inherit tenant-wide manager read paths.
2. **Data:** Seed **Worker B** via MCP SQL: `auth.users` + `auth.identities` + `tenant_members` + `worker_reports` row owned by B.
3. **Proof:** **Worker A** JWT + `x-client: ios_lite` → **404** on B’s report id; **Worker B** JWT + same headers → **200** on same id.

## Blocker

**None** for this sprint — path executed end-to-end.
