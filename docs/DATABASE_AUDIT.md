# Database Audit Report

**Date:** 2026-03-07  
**Stage:** 4 - Database & Data Integrity

## Executive Summary

Comprehensive audit of database schema, migrations, and data integrity reveals:
- **43 migrations** total
- **3 duplicate table definitions** requiring consolidation
- **4 tables missing RLS policies** (security risk)
- **17+ missing indexes** on foreign keys and frequently queried columns
- **Schema inconsistencies** between duplicate migrations

## 1. Schema Correctness

### ✅ Strengths
- All tables have primary keys
- Foreign keys properly defined with appropriate `on delete` actions
- Check constraints used for enums/status fields
- Unique constraints where needed
- Data types consistent (UUID, timestamptz)

### ❌ Issues

#### Duplicate Table Definitions
1. **`ai_policy_decisions`** - Created in:
   - `20260306430000_ai_policy_decisions.sql` (earlier)
   - `20260306450000_ai_policy_decisions.sql` (later, different RLS policy)
   - **Action:** Consolidate or remove earlier migration

2. **`slo_daily` and `alerts`** - Created in:
   - `20260306460000_slo_alerts.sql` (earlier, `alerts.message` nullable)
   - `20260306480000_slo_alerts.sql` (later, `alerts.message` NOT NULL, adds index)
   - **Action:** Consolidate or remove earlier migration

3. **`tenant_settings`** - Created in:
   - `20260306490000_tenant_settings.sql` (missing `public.` prefix, has `updated_at`)
   - `20260306500000_tenant_settings_residency.sql` (has `public.` prefix, no `updated_at`, adds RLS)
   - **Action:** Consolidate or remove earlier migration

#### Missing NOT NULL Constraints
- `ai_usage.tenant_id` - Should be NOT NULL (tenant-scoped)
- `events.tenant_id` - Should be NOT NULL (tenant-scoped)
- `alerts.tenant_id` - Nullable in earlier migration (later migration allows null with check)

## 2. Indexes

### ✅ Strengths
- Most tenant-scoped tables have `(tenant_id, created_at desc)` indexes
- Composite indexes for common query patterns
- Job queue has proper indexes for claiming

### ❌ Missing Indexes

#### Foreign Key Indexes (17+ missing)
1. `worker_reports.day_id` → `worker_day(id)`
2. `worker_report_media.media_id` → `media(id)`
3. `worker_report_media.upload_session_id` → `upload_sessions(id)`
4. `worker_tasks.project_id` → `projects(id)`
5. `worker_tasks.assigned_to` → `auth.users(id)`
6. `photo_annotations.media_id` → `media(id)`
7. `photo_comments.media_id` → `media(id)`
8. `change_log.resource_id` → various tables
9. `organization_tenants.tenant_id` → `tenants(id)`
10. `task_assignments.task_id` → `worker_tasks(id)`
11. And 6+ more...

#### Frequently Queried Columns
- `ai_usage.user_id` - No index
- `ai_usage.trace_id` - No index
- `jobs.user_id` - No index
- `jobs.trace_id` - No index
- `jobs.locked_by` - No index (used for job locking)
- `upload_sessions.status` - No index
- `push_outbox.user_id` - No index
- `push_outbox.platform` - No index
- `device_tokens.token` - No index (used for lookups)
- `sso_sessions.nonce` - No index

#### Composite Indexes
- `jobs(tenant_id, user_id, created_at)` - for user-specific job queries
- `ai_usage(tenant_id, user_id, created_at)` - for user-specific usage queries
- `events(tenant_id, user_id, ts)` - for user-specific event queries

## 3. Migrations

### ✅ Strengths
- All migrations use consistent timestamp format
- Timestamps are sequential and chronological
- No future-dated migrations
- Most migrations use `if not exists` for safety

### ❌ Issues

#### Duplicate Migrations
- 3 pairs of duplicate table definitions (see Schema Correctness)

#### Rollback Safety
- No explicit rollback scripts
- Some migrations drop and recreate constraints
- **Recommendation:** Document rollback procedures

## 4. Tenant Isolation

### ✅ Strengths
- Most tenant-scoped tables have RLS enabled
- RLS policies use tenant membership checks
- Foreign keys use `on delete cascade` appropriately
- Tenant_id indexes present on most tables

### ❌ Missing RLS Policies (CRITICAL)

1. **`rate_limit_slots`** - RLS enabled but no policy (blocks all access)
2. **`ai_usage`** - RLS enabled but no policy (blocks all access)
3. **`tenant_billing_state`** - RLS enabled but no policy (blocks all access)
4. **`tenant_concurrency`** - No RLS enabled (should have RLS for tenant isolation)

### RLS Policy Coverage
- ✅ 35+ tables have proper RLS policies
- ❌ 4 tables missing RLS policies (security risk)

## 5. Data Consistency

### ✅ Strengths
- Foreign keys properly defined
- No circular dependencies
- Appropriate use of `on delete set null` vs `on delete cascade`
- Data types consistent

### ⚠️ Potential Issues
- `worker_reports.day_id` uses `on delete set null` - acceptable (orphaned reports possible)
- `worker_tasks.project_id` uses `on delete set null` - acceptable (orphaned tasks possible)
- `worker_reports.task_id` uses `on delete set null` - acceptable

## Critical Issues Summary

| Issue | Severity | Count | Impact |
|-------|----------|-------|--------|
| Missing RLS policies | 🔴 CRITICAL | 4 | Security risk - tenant data leakage |
| Missing foreign key indexes | 🟡 HIGH | 17+ | Performance degradation |
| Missing query indexes | 🟡 HIGH | 10+ | Performance degradation |
| Duplicate migrations | 🟡 MEDIUM | 3 pairs | Schema confusion, potential conflicts |
| Missing NOT NULL constraints | 🟢 LOW | 3 | Data integrity risk |

## Recommendations

### Immediate Actions (Security)
1. **Add RLS policies** for:
   - `rate_limit_slots`
   - `ai_usage`
   - `tenant_billing_state`
   - `tenant_concurrency`

### High Priority (Performance)
2. **Add indexes** on:
   - Foreign key columns (17+)
   - Frequently queried columns (user_id, trace_id, etc.)
   - Composite indexes for common query patterns

### Medium Priority (Maintenance)
3. **Consolidate duplicate migrations**:
   - Remove or consolidate `ai_policy_decisions` migrations
   - Remove or consolidate `slo_alerts` migrations
   - Remove or consolidate `tenant_settings` migrations

4. **Add NOT NULL constraints** where appropriate

5. **Document rollback procedures** for migrations

## Next Steps

1. Create migration to add missing RLS policies
2. Create migration to add missing indexes
3. Document duplicate migrations for cleanup
4. Verify RLS policies in production

---

**Status:** ⚠️ **REQUIRES ATTENTION** - Critical security and performance issues identified
