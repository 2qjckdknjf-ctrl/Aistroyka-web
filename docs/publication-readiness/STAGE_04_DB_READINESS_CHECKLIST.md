# Stage 04 DB Readiness Checklist (Operator Runbook)

Run from repository root unless noted otherwise.

## 1) Authenticate and link target Supabase project

```bash
supabase login
supabase link --workdir apps/web --project-ref <PROJECT_REF>
export SUPABASE_DB_PASSWORD='<db_password>'
```

## 2) Inspect local vs remote migration state

```bash
supabase migration list --workdir apps/web
bash scripts/release/check-migrations.sh
```

## 3) Dry-run apply

```bash
supabase db push --dry-run --workdir apps/web
```

## 4) Apply pending migrations (only after dry-run review)

```bash
supabase db push --workdir apps/web
```

## 5) Verify publication-critical tables

```sql
select table_name
from information_schema.tables
where table_schema='public'
  and table_name in (
    'tenants',
    'tenant_members',
    'projects',
    'project_members',
    'worker_tasks',
    'worker_reports',
    'upload_sessions',
    'project_documents',
    'project_cost_items',
    'project_milestones',
    'audit_logs',
    'alerts'
  )
order by table_name;
```

## 6) Verify basic RLS posture for sensitive entities

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname='public'
  and tablename in ('project_documents','project_cost_items','worker_reports','projects');
```

## 7) Optional smoke of cost/docs milestones readiness

```sql
select count(*) from public.project_cost_items;
select count(*) from public.project_documents;
select count(*) from public.project_milestones;
```

