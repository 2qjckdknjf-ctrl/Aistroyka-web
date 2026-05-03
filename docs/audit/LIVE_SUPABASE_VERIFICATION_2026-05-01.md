# LIVE Supabase Verification (2026-05-01)

## Scope

- Validate live Supabase migration history and dry-run readiness.
- Required checks:
  - `supabase projects list`
  - `supabase link --project-ref <target_ref> --yes`
  - `supabase migration list`
  - `supabase db push --dry-run --linked`
  - required live tables presence:
    - `project_documents`
    - `project_cost_items`
    - `project_milestones`
    - `worker_reports`
    - `worker_tasks`
    - `media`
    - `upload_sessions`
    - `audit_logs`

## Executed checks

1. `supabase --version`
   - Output: `2.75.0` (CLI installed).

2. Environment availability check
   - `SUPABASE_ACCESS_TOKEN`: **UNSET**
   - `SUPABASE_PROJECT_REF`: **UNSET**

3. `supabase projects list`
   - Output: **BLOCKED**
   - Error:
     - `Access token not provided. Supply an access token by running supabase login or setting the SUPABASE_ACCESS_TOKEN environment variable.`

## Live verification result

- `supabase projects list`: **BLOCKED**
- `supabase link --project-ref <target_ref> --yes`: **BLOCKED** (no project ref)
- `supabase migration list`: **BLOCKED**
- `supabase db push --dry-run --linked`: **BLOCKED**
- Required table checks on linked live DB: **BLOCKED**

## Exact external blockers

- Missing secret: `SUPABASE_ACCESS_TOKEN`
- Missing target ref: `SUPABASE_PROJECT_REF`

## Operator commands to close blocker

```bash
export SUPABASE_ACCESS_TOKEN="<supabase_pat>"
export SUPABASE_PROJECT_REF="<target_project_ref>"

supabase projects list
supabase link --project-ref "$SUPABASE_PROJECT_REF" --yes
supabase migration list
supabase db push --dry-run --linked

# Non-destructive live table existence check
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

- **Supabase live: BLOCKED**
