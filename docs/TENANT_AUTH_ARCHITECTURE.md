# Tenant & Auth Architecture

**Date:** 2026-03-07  
**Stage:** 7 - Tenant & Auth Boundary Enforcement

## Executive Summary

Tenant and auth boundaries are **consistently enforced** across the codebase. All routes validate tenant context, and tenant isolation is enforced at both application and database levels.

## Request Flow

### Standard Flow
```
1. Request arrives
   ↓
2. Middleware: getTenantContextFromRequest()
   ↓
3. Route: requireTenant(ctx)
   ↓
4. Service: Policy check (canPerformAction)
   ↓
5. Repository: Query with tenant_id
   ↓
6. Database: RLS policy enforcement
```

### Tenant Context Resolution
**Location:** `lib/tenant/tenant.context.ts`

**Process:**
1. Extract user from Supabase Auth
2. Find tenant (own tenant or first membership)
3. Resolve role in tenant
4. Load permissions and scopes (if RBAC enabled)

**Function:**
```typescript
getTenantContextFromRequest(request: Request): Promise<TenantContextOrAbsent>
```

**Returns:**
- `TenantContext` - Full context with tenantId, userId, role, permissions
- `TenantContextOrAbsent` - Absent context for unauthenticated requests

---

## Tenant Resolution Path

### Step 1: User Authentication
- Supabase Auth session check
- Cookie-based session management
- Middleware: `lib/supabase/middleware.ts`

### Step 2: Tenant Resolution
- Check if user owns a tenant
- Check tenant_members table
- Return first active tenant

### Step 3: Role Resolution
- Owner if user_id matches tenant.user_id
- Member role from tenant_members table
- Fallback to null if no membership

### Step 4: Permission Loading
- Load RBAC permissions for role
- Load user scopes (resource-scoped permissions)
- Cache in tenant context

---

## Auth Resolution Path

### Authentication
- **Provider:** Supabase Auth
- **Methods:** Email/password, OAuth
- **Session:** Cookie-based with SSR
- **Middleware:** `apps/web/middleware.ts`

### Authorization
- **System:** RBAC (Role-Based Access Control)
- **Roles:** OWNER, MANAGER, WORKER, CONTRACTOR
- **Permissions:** Resource-scoped actions
- **Enforcement:** Policy checks in services

---

## Tenant Context Validation

### Route Level
**Pattern:**
```typescript
const ctx = await getTenantContextFromRequest(request);
requireTenant(ctx);
```

**Function:** `requireTenant(ctx: TenantContextOrAbsent)`
- Throws `TenantRequiredError` if tenant absent
- Used in all tenant-scoped routes

### Service Level
**Pattern:**
```typescript
if (!ctx.tenantId) {
  return { data: null, error: "Unauthorized" };
}
```

**Enforcement:**
- All services check tenant context
- All repository calls include tenantId
- No implicit tenant assumptions

### Repository Level
**Pattern:**
```typescript
.eq("tenant_id", tenantId)
```

**Enforcement:**
- All queries include tenant_id filter
- No queries without tenant scope
- RLS policies as backup

### Database Level
**Enforcement:**
- Row Level Security (RLS) policies
- All tenant-scoped tables have RLS
- Policies check tenant membership

---

## Tenant Isolation

### Application Level
- ✅ Tenant context required for all tenant-scoped operations
- ✅ Tenant ID passed explicitly to all queries
- ✅ No implicit tenant assumptions
- ✅ Policy checks enforce access control

### Database Level
- ✅ RLS policies on all tenant-scoped tables
- ✅ Policies check tenant membership via `tenant_members`
- ✅ Foreign keys enforce referential integrity
- ✅ Cascade deletes for tenant cleanup

### Query Level
- ✅ All queries include `.eq("tenant_id", tenantId)`
- ✅ No queries without tenant filter
- ✅ Composite indexes include tenant_id

---

## Auth Boundary

### Authentication Boundary
**Location:** `lib/supabase/middleware.ts`, `apps/web/middleware.ts`

**Responsibilities:**
- Session management
- User authentication
- Cookie handling
- Redirect logic

**Forbidden:**
- ❌ Business logic
- ❌ Tenant resolution (delegated to tenant.context.ts)
- ❌ Authorization decisions

### Authorization Boundary
**Location:** `lib/authz/`, `lib/domain/**/*.policy.ts`

**Responsibilities:**
- Permission checking
- Role validation
- Resource-scoped access control

**Pattern:**
```typescript
if (!canPerformAction(ctx)) {
  return { data: null, error: "Insufficient rights" };
}
```

---

## Tenant-Optional Endpoints

### Documented Exceptions
1. **`/api/v1/config`**
   - **Reason:** Returns public config, tenant-optional
   - **Status:** ✅ Documented

2. **`/api/tenant/accept-invite`**
   - **Reason:** Invitation acceptance is pre-tenant
   - **Status:** ✅ Documented

3. **`/api/health/*`**
   - **Reason:** Health checks don't require tenant
   - **Status:** ✅ Documented

---

## Risks Fixed

### Before Refactoring
- ⚠️ Some routes missing tenant checks
- ⚠️ Some routes with implicit tenant assumptions
- ⚠️ Direct DB queries without tenant filter

### After Refactoring
- ✅ All routes validate tenant context
- ✅ All services check tenant context
- ✅ All repositories require tenantId
- ✅ All queries include tenant filter

---

## Remaining Edge Cases

### None Identified
- ✅ All critical paths validated
- ✅ All tenant-scoped operations isolated
- ✅ All exceptions documented

---

## Tenant Context Propagation

### Explicit Propagation
```typescript
// ✅ CORRECT: Tenant context passed explicitly
export async function serviceFunction(
  supabase: SupabaseClient,
  ctx: TenantContext,  // ← Explicit
  input: InputType
) {
  const data = await repo.getById(supabase, ctx.tenantId, input.id);
}
```

### No Implicit Assumptions
```typescript
// ❌ WRONG: Implicit tenant assumption
export async function serviceFunction(
  supabase: SupabaseClient,
  input: InputType
) {
  // ❌ No tenant context
  const data = await supabase.from("table").select("*");
}
```

---

## Authorization Enforcement

### Policy Checks
- ✅ All services check policies before operations
- ✅ Policy functions in `*.policy.ts` files
- ✅ Role hierarchy enforced

### Resource Ownership
- ✅ Resource ownership validated in services
- ✅ Cross-tenant access prevented
- ✅ Admin operations clearly separated

---

## Summary

- **Tenant Context Resolution:** ✅ Consistent
- **Tenant Validation:** ✅ All routes validated
- **Tenant Isolation:** ✅ Application + DB level
- **Auth Flow:** ✅ Properly separated
- **Authorization:** ✅ Policy-based enforcement
- **Risks Fixed:** ✅ All critical risks addressed

---

**Status:** ✅ **ENFORCED** - Tenant and auth boundaries consistently enforced
