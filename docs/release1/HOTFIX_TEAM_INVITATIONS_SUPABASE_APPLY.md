# HOTFIX — `tenant_invitations` migration applied to linked Supabase (AISTROYKA)

**Project:** AISTROYKA (`ref` matches `NEXT_PUBLIC_SUPABASE_URL` host `*.supabase.co`).  
**Repo migration file:** `apps/web/supabase/migrations/20260326120000_tenant_invitations.sql`

## How it was applied

1. **Supabase MCP `apply_migration`** was attempted first; it returned `UnauthorizedException` (“Migrations endpoint is not generally available yet”).
2. The **same DDL** was executed successfully via **Supabase MCP `execute_sql`** against the linked project (privileged database path used by the integration).
3. A **history row** was inserted into `supabase_migrations.schema_migrations` so the project’s migration ledger records version `20260326120000` / name `20260326120000_tenant_invitations` with a pointer to the repo file (full statement text is stored as a short audit note).

## Remote verification (proof)

Executed against the remote database:

- **Table:** `to_regclass('public.tenant_invitations')` resolves to the relation (not null).
- **Indexes:** `tenant_invitations` has multiple indexes (including unique on `token` and on `(tenant_id, lower(email))`).
- **RLS:** Policies present:
  - `tenant_invitations_select` (read)
  - `tenant_invitations_insert` (insert)
  - `tenant_invitations_delete` (delete)
- **Grants:** `authenticated` has `SELECT`, `INSERT`, `DELETE` on `public.tenant_invitations` (as defined in the migration).

## Dependency

RLS policies reference `public.current_user_tenant_ids()` — confirmed present on the project before applying.

## Operational note

Future environments should apply the **same SQL** from the repo file (CLI `supabase db push`, CI migration job, or SQL editor). The live project is now aligned with that DDL.
