# Target Architecture Standard

**Date:** 2026-03-07  
**Stage:** 2 - Define Target Architecture  
**Status:** Enforceable Architecture Standard

## Overview

This document defines the enforceable architecture standard for the AISTROYKA system. All code must conform to these patterns and boundaries.

## Layer Responsibilities

### 1. Clients / UI Layer
**Location:** `apps/web/app/[locale]/(dashboard)/**/*.tsx`, `ios/WorkerLite/**/*.swift`

**Responsibilities:**
- Render UI components
- Handle user interactions
- Call API endpoints (via fetch or API client)
- Manage local state
- Handle client-side validation

**Allowed Dependencies:**
- API endpoints (`/api/**`)
- API client SDK (`@aistroyka/api-client`)
- UI libraries (React, SwiftUI)
- State management (TanStack Query, local state)

**Forbidden Dependencies:**
- ❌ Direct database access (Supabase client)
- ❌ Direct service layer calls
- ❌ Direct repository calls
- ❌ Business logic
- ❌ HTTP client libraries (use API endpoints)

**Example:**
```typescript
// ✅ CORRECT: UI calls API endpoint
const { data } = useQuery({
  queryKey: ['projects'],
  queryFn: () => fetch('/api/v1/projects').then(r => r.json())
});

// ❌ WRONG: UI calls database directly
const { data } = await supabase.from('projects').select('*');
```

---

### 2. API / Route Handlers Layer
**Location:** `apps/web/app/api/**/*.ts`

**Responsibilities:**
- Parse HTTP requests
- Validate input (type checking, basic validation)
- Resolve auth/user/tenant context
- Call domain services
- Map service results to HTTP responses
- Handle errors and map to HTTP status codes
- Set HTTP headers

**Allowed Dependencies:**
- Domain services (`lib/domain/**/*.service.ts`)
- Tenant context (`lib/tenant/**`)
- Auth helpers (`lib/auth/**`)
- Input validation (Zod schemas)
- Error mapping utilities
- HTTP response utilities

**Forbidden Dependencies:**
- ❌ Direct database operations (`supabase.from()`, `supabase.rpc()`)
- ❌ Direct repository calls (except through services)
- ❌ Business logic (decision trees, calculations, transformations)
- ❌ Provider-specific logic
- ❌ Change-log emissions (should be in services)

**Pattern:**
```typescript
// ✅ CORRECT: Route orchestrates service calls
export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  requireTenant(ctx);
  
  const url = new URL(request.url);
  const projectId = url.searchParams.get("project_id");
  
  const supabase = await createClient();
  const { data, error } = await listProjects(supabase, ctx);
  
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  
  return NextResponse.json({ data });
}

// ❌ WRONG: Route contains business logic
export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  const supabase = await createClient();
  
  // ❌ Direct DB operation
  const { data: projects } = await supabase.from("projects")...
  
  // ❌ Business logic
  const enriched = projects.map(p => ({
    ...p,
    status: calculateStatus(p), // ❌ Business logic
  }));
  
  return NextResponse.json({ data: enriched });
}
```

---

### 3. Auth / Tenant Context Layer
**Location:** `lib/tenant/**`, `lib/auth/**`

**Responsibilities:**
- Resolve tenant context from request
- Validate tenant membership
- Resolve user authentication
- Provide tenant/user context to services
- Enforce tenant isolation

**Allowed Dependencies:**
- Supabase auth client
- Database (for tenant membership checks only)
- Context types

**Forbidden Dependencies:**
- ❌ Business logic
- ❌ Domain services
- ❌ HTTP concerns (except request parsing)

**Pattern:**
```typescript
// ✅ CORRECT: Context resolution
export async function getTenantContextFromRequest(
  request: Request
): Promise<TenantContextOrAbsent> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return { tenantId: null, ... };
  
  const tenantId = await getActiveTenantId(supabase, user.id);
  // ... resolve tenant context
  return { tenantId, userId: user.id, ... };
}
```

---

### 4. Domain Services Layer
**Location:** `lib/domain/**/*.service.ts`

**Responsibilities:**
- Enforce business rules
- Enforce domain invariants
- Orchestrate repositories and providers
- Coordinate cross-domain operations
- Emit change-log events
- Emit audit events
- Enforce authorization policies

**Allowed Dependencies:**
- Repositories (`lib/domain/**/*.repository.ts`)
- Platform services (`lib/platform/**`)
- Policy modules (`lib/domain/**/*.policy.ts`)
- Change-log repository (for sync)
- Audit service
- Job service (for async operations)
- Tenant context types

**Forbidden Dependencies:**
- ❌ Direct database operations (`supabase.from()`, `supabase.rpc()`)
- ❌ HTTP concerns (Request, Response, NextResponse)
- ❌ UI components
- ❌ Route handlers
- ❌ Provider-specific implementations (use interfaces)

**Pattern:**
```typescript
// ✅ CORRECT: Service orchestrates repositories
export async function listReports(
  supabase: SupabaseClient,
  ctx: TenantContext,
  filters: ListFilters
): Promise<{ data: Report[]; error: string | null }> {
  // Policy check
  if (!canReadReports(ctx)) {
    return { data: [], error: "Insufficient rights" };
  }
  
  // Use repository
  const data = await reportRepo.list(supabase, ctx.tenantId, filters);
  
  // Business logic: enrichment
  const enriched = await enrichReportsWithMetadata(supabase, data);
  
  return { data: enriched, error: null };
}

// ❌ WRONG: Service calls DB directly
export async function listReports(...) {
  // ❌ Direct DB operation
  const { data } = await supabase.from("reports")...
  return { data, error: null };
}
```

---

### 5. Repositories / Data Access Layer
**Location:** `lib/domain/**/*.repository.ts`, `lib/platform/**/*.repository.ts`

**Responsibilities:**
- Execute database queries
- Map database records to domain types
- Handle persistence operations
- Provide query abstractions
- Handle data access errors

**Allowed Dependencies:**
- Supabase client
- Database types
- Domain types

**Forbidden Dependencies:**
- ❌ Business logic
- ❌ HTTP concerns
- ❌ Provider-specific logic
- ❌ Domain services (circular dependency)
- ❌ Policy modules

**Pattern:**
```typescript
// ✅ CORRECT: Repository handles data access
export async function listByTenant(
  supabase: SupabaseClient,
  tenantId: string
): Promise<Report[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  
  if (error) return [];
  return (data ?? []) as Report[];
}

// ❌ WRONG: Repository contains business logic
export async function listByTenant(...) {
  const { data } = await supabase.from("reports")...
  // ❌ Business logic
  return data.filter(r => r.status === "active").map(enrich);
}
```

---

### 6. Platform / Providers Layer
**Location:** `lib/platform/**`

**Responsibilities:**
- External system integrations
- Provider-specific implementations
- Retry logic
- Timeout handling
- Fallback chains
- Circuit breakers
- Rate limiting

**Allowed Dependencies:**
- External APIs (OpenAI, Anthropic, Stripe, etc.)
- Supabase (for storage, auth)
- Platform-specific utilities
- Provider interfaces

**Forbidden Dependencies:**
- ❌ Domain services (use interfaces/adapters)
- ❌ Business logic
- ❌ HTTP route handlers

**Pattern:**
```typescript
// ✅ CORRECT: Provider handles external integration
export async function invokeVision(
  imageUrl: string,
  options: VisionOptions
): Promise<VisionResult | null> {
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ image_url: imageUrl, ...options }),
    });
    return await response.json();
  } catch (error) {
    // Handle provider-specific errors
    return null;
  }
}
```

---

## Allowed Dependencies Matrix

| From Layer | To Layer | Allowed |
|------------|----------|---------|
| UI | API Routes | ✅ Yes |
| UI | Domain Services | ❌ No |
| UI | Repositories | ❌ No |
| API Routes | Domain Services | ✅ Yes |
| API Routes | Repositories | ❌ No (use services) |
| API Routes | Providers | ❌ No (use services) |
| Domain Services | Repositories | ✅ Yes |
| Domain Services | Platform Services | ✅ Yes |
| Domain Services | Providers (via interfaces) | ✅ Yes |
| Repositories | Database | ✅ Yes |
| Providers | External APIs | ✅ Yes |

## Naming Conventions

### Services
- **File:** `{domain}.service.ts`
- **Functions:** `verbNoun()` (e.g., `createReport`, `listProjects`)
- **Location:** `lib/domain/{domain}/{domain}.service.ts`

### Repositories
- **File:** `{domain}.repository.ts`
- **Functions:** `verbNoun()` (e.g., `listByTenant`, `getById`)
- **Location:** `lib/domain/{domain}/{domain}.repository.ts`

### Routes
- **File:** `route.ts`
- **Functions:** `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
- **Location:** `app/api/v1/{resource}/route.ts` or `app/api/v1/{resource}/[id]/route.ts`

### Policies
- **File:** `{domain}.policy.ts`
- **Functions:** `can{Action}()` (e.g., `canReadProjects`, `canManageTasks`)
- **Location:** `lib/domain/{domain}/{domain}.policy.ts`

## Service/Repository/Provider Contracts

### Service Contract
```typescript
// Service functions must:
// 1. Accept SupabaseClient and TenantContext
// 2. Return typed results with error handling
// 3. Enforce authorization policies
// 4. Use repositories for data access

export async function serviceFunction(
  supabase: SupabaseClient,
  ctx: TenantContext,
  input: InputType
): Promise<{ data: OutputType | null; error: string }> {
  // 1. Policy check
  if (!canPerformAction(ctx)) {
    return { data: null, error: "Insufficient rights" };
  }
  
  // 2. Validate input
  if (!isValid(input)) {
    return { data: null, error: "Invalid input" };
  }
  
  // 3. Use repository
  const data = await repository.getById(supabase, ctx.tenantId, input.id);
  
  // 4. Business logic
  const result = transformData(data);
  
  // 5. Return result
  return { data: result, error: "" };
}
```

### Repository Contract
```typescript
// Repository functions must:
// 1. Accept SupabaseClient and tenantId
// 2. Return domain types (not raw DB records)
// 3. Handle errors gracefully
// 4. No business logic

export async function repositoryFunction(
  supabase: SupabaseClient,
  tenantId: string,
  filters: Filters
): Promise<DomainType[]> {
  const { data, error } = await supabase
    .from("table_name")
    .select("*")
    .eq("tenant_id", tenantId)
    .match(filters);
  
  if (error) return [];
  return (data ?? []) as DomainType[];
}
```

### Provider Contract
```typescript
// Provider functions must:
// 1. Accept provider-specific options
// 2. Return typed results
// 3. Handle errors and retries
// 4. No business logic

export async function providerFunction(
  input: ProviderInput,
  options: ProviderOptions
): Promise<ProviderResult | null> {
  try {
    const response = await externalApiCall(input, options);
    return parseResponse(response);
  } catch (error) {
    if (isRetryable(error)) {
      // Retry logic
    }
    return null;
  }
}
```

## Tenant/Auth Boundary Rules

### Tenant Context Resolution
1. **All tenant-scoped operations** must resolve tenant context
2. **Tenant context** must be validated before use
3. **Tenant ID** must be passed explicitly (no implicit assumptions)
4. **RLS policies** must enforce tenant isolation at DB level

### Authorization Flow
```
Request → getTenantContextFromRequest() → requireTenant() → Service → Policy Check → Repository
```

### Tenant Context Propagation
```typescript
// ✅ CORRECT: Tenant context propagated explicitly
export async function serviceFunction(
  supabase: SupabaseClient,
  ctx: TenantContext,  // ← Tenant context passed explicitly
  input: InputType
) {
  // Use ctx.tenantId explicitly
  const data = await repo.getById(supabase, ctx.tenantId, input.id);
}

// ❌ WRONG: Implicit tenant assumption
export async function serviceFunction(
  supabase: SupabaseClient,
  input: InputType
) {
  // ❌ No tenant context, implicit assumption
  const data = await supabase.from("table").select("*");
}
```

## Error Handling Flow

### Error Types
1. **Domain Errors:** Business rule violations (e.g., "Insufficient rights", "Report already submitted")
2. **Validation Errors:** Input validation failures (e.g., "Invalid email", "Missing required field")
3. **Not Found Errors:** Resource not found (e.g., "Project not found")
4. **System Errors:** Infrastructure failures (e.g., "Database connection failed")

### Error Mapping
```typescript
// Service returns domain errors
const { data, error } = await serviceFunction(supabase, ctx, input);

// Route maps to HTTP status
if (error === "Insufficient rights") {
  return NextResponse.json({ error }, { status: 403 });
}
if (error === "Not found") {
  return NextResponse.json({ error }, { status: 404 });
}
if (error) {
  return NextResponse.json({ error }, { status: 400 });
}
```

### Error Handling Pattern
```typescript
// ✅ CORRECT: Typed error handling
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContextFromRequest(request);
    requireTenant(ctx);
    
    const { data, error } = await serviceFunction(supabase, ctx, input);
    
    if (error) {
      const status = mapErrorToStatus(error);
      return NextResponse.json({ error }, { status });
    }
    
    return NextResponse.json({ data });
  } catch (err) {
    // Unexpected errors
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## Request Lifecycle

```
1. Request arrives at route handler
   ↓
2. Parse request (URL, body, headers)
   ↓
3. Resolve tenant context (getTenantContextFromRequest)
   ↓
4. Validate tenant context (requireTenant)
   ↓
5. Validate input (Zod schemas, type checks)
   ↓
6. Call domain service
   ↓
7. Service enforces policy (canPerformAction)
   ↓
8. Service calls repository
   ↓
9. Repository executes query
   ↓
10. Service applies business logic
   ↓
11. Service returns result
   ↓
12. Route maps result to HTTP response
   ↓
13. Return response
```

## Enforcement Rules

### Must Have
- ✅ All routes must use services (no direct DB calls)
- ✅ All services must use repositories (no direct DB calls)
- ✅ All tenant-scoped operations must validate tenant context
- ✅ All business logic must be in services
- ✅ All data access must be in repositories

### Must Not Have
- ❌ Business logic in routes
- ❌ Direct DB operations in routes
- ❌ Direct DB operations in services
- ❌ Provider-specific logic in services
- ❌ HTTP concerns in services
- ❌ Business logic in repositories

## Exceptions

### Justified Exceptions
1. **Health check endpoints:** May bypass tenant context
2. **Auth endpoints:** May have custom flow
3. **Admin endpoints:** May use admin client directly (with proper authorization)
4. **Change-log repository:** May be called from services (for sync)

### Exception Documentation
All exceptions must be documented with:
- Why the exception is needed
- What alternative was considered
- How the exception is safe

## Architecture Guardrails

### Code Review Checklist
- [ ] Route handler only orchestrates (no business logic)
- [ ] Route handler uses services (no direct DB calls)
- [ ] Service uses repositories (no direct DB calls)
- [ ] Tenant context validated
- [ ] Authorization policy enforced
- [ ] Errors handled consistently
- [ ] Types used throughout

### Automated Checks (Future)
- ESLint rules for import boundaries
- TypeScript path mapping restrictions
- Architecture tests for layer violations

---

**Status:** ✅ **STANDARD DEFINED** - Ready for enforcement
