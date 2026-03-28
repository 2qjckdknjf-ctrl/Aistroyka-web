# Wave 3 — Worker B setup report

**Date (UTC):** 2026-03-28

## Status

**SUCCESS** — second user exists in the **same tenant** as smoke user A.

## Method

- **Canonical path:** Supabase MCP **`execute_sql`** (Postgres superuser) — **not** a product UI flow; acceptable for operator-only pilot seeding with minimal blast radius.
- **Email (public):** `worker-b-wave3@aistroyka.ai`
- **User id (public):** `c2b2b2b2-b2b2-4b2b-b2b2-b2b2b2b2b2b1`
- **Tenant id:** `81870b1a-1118-46a4-9c5d-969ccdf47b58` (same as smoke tenant)
- **tenant_members.role:** `member`

## Authentication

- Password was set via `crypt(..., gen_salt('bf'))` in SQL at seed time.
- **Operator action:** rotate this user’s password in **Supabase Auth** (or delete user) after audit — **not** stored in the repository.

## Same tenant confirmed

**YES** — `tenant_members.tenant_id` matches smoke user’s tenant.
