# Live Supabase Parity Report

## Goal

Verify live Supabase migration parity and dry-run safety against linked target project.

## Commands executed

```bash
supabase --version
supabase projects list
supabase migration list
supabase db push --dry-run --linked
```

## Results

1. CLI version:
   - `2.75.0`
2. `supabase projects list`:
   - failed: access token missing
   - message: run `supabase login` or set `SUPABASE_ACCESS_TOKEN`
3. `supabase migration list`:
   - failed: `unexpected login role status 401: {"message":"Unauthorized"}`
   - message indicates missing DB password for login role
4. `supabase db push --dry-run --linked`:
   - failed with same 401 unauthorized / missing DB password path

## Parity classification

- **BLOCKED_EXTERNAL**
- Parity cannot be proven from current environment because required auth inputs are absent.

## Missing inputs

- `SUPABASE_ACCESS_TOKEN`
- linked project context (`supabase link --project-ref <PROJECT_REF>`)
- `SUPABASE_DB_PASSWORD`

## Operator closure commands

```bash
cd apps/web
supabase login
supabase link --project-ref <PROJECT_REF>
export SUPABASE_DB_PASSWORD='<DB_PASSWORD>'
supabase migration list
supabase db push --dry-run --linked
```

## Verdict

**BLOCKED_EXTERNAL**

