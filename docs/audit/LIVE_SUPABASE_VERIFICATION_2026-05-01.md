# LIVE Supabase Verification (2026-05-01)

## Scope

- Verify live Supabase access and migration state.
- Required checks:
  - `supabase projects list`
  - `supabase link --project-ref <target_ref>`
  - `supabase migration list`
  - `supabase db push --dry-run --linked`
  - live table presence validation.

## Executed checks

1. `supabase --version`
   - Result: `2.75.0` (installed).
   - Note: CLI reported newer version available (`2.95.4`).

2. `supabase projects list`
   - Result: **FAIL / BLOCKED**
   - Error:
     - `Access token not provided. Supply an access token by running supabase login or setting the SUPABASE_ACCESS_TOKEN environment variable.`

3. Environment presence check
   - `SUPABASE_ACCESS_TOKEN`: **not set**
   - `SUPABASE_PROJECT_REF`: **not set**

## Live verification status

- Supabase live project listing: **BLOCKED**
- Supabase link to target project: **BLOCKED**
- Migration history (`supabase migration list`): **BLOCKED**
- Target dry-run (`supabase db push --dry-run --linked`): **BLOCKED**
- Live required-table verification: **BLOCKED**

## Blocker details

- Missing required credentials in current session:
  - `SUPABASE_ACCESS_TOKEN`
  - `SUPABASE_PROJECT_REF`

## Exact operator commands (once secrets are available)

```bash
export SUPABASE_ACCESS_TOKEN="<supabase_pat>"
export SUPABASE_PROJECT_REF="<target_project_ref>"

supabase projects list
supabase link --project-ref "$SUPABASE_PROJECT_REF" --yes
supabase migration list
supabase db push --dry-run --linked
```

Optional (table presence sanity after linking, non-destructive):

```bash
supabase db query "
select to_regclass('public.project_documents') as project_documents,
       to_regclass('public.project_cost_items') as project_cost_items,
       to_regclass('public.project_milestones') as project_milestones,
       to_regclass('public.worker_reports') as worker_reports,
       to_regclass('public.worker_tasks') as worker_tasks,
       to_regclass('public.media') as media,
       to_regclass('public.upload_sessions') as upload_sessions,
       to_regclass('public.audit_logs') as audit_logs;
"
```

## Verdict

- **Supabase live verification: BLOCKED (credentials missing).**
