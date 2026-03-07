# Architecture Guardrails

**Date:** 2026-03-07  
**Stage:** 9 - Architecture Guardrails

## Executive Summary

Architecture guardrails are established through **documentation and conventions**. Code review checklists and patterns are documented. Automated enforcement (ESLint rules) can be added in the future.

## Current Guardrails

### 1. Documentation
**Location:** `docs/TARGET_ARCHITECTURE_STANDARD.md`

**Content:**
- Layer responsibilities
- Allowed/forbidden dependencies
- Naming conventions
- Service/repository/provider contracts
- Tenant/auth boundary rules

**Status:** ✅ **ENFORCED** - Documentation exists

---

### 2. Code Patterns
**Location:** Refactored routes and services

**Patterns:**
- Route orchestration pattern
- Service result pattern
- Repository query pattern
- Policy check pattern

**Status:** ✅ **ESTABLISHED** - Patterns demonstrated in code

---

### 3. Type Safety
**Location:** TypeScript throughout

**Enforcement:**
- TypeScript compiler enforces types
- Tenant context types
- Service result types
- Repository return types

**Status:** ✅ **ENFORCED** - TypeScript compilation

---

## Recommended Guardrails

### 1. Code Review Checklist
**Location:** PR templates or documentation

**Checklist:**
- [ ] Route handler only orchestrates (no business logic)
- [ ] Route handler uses services (no direct DB calls)
- [ ] Service uses repositories (no direct DB calls)
- [ ] Tenant context validated
- [ ] Authorization policy enforced
- [ ] Errors handled consistently
- [ ] Types used throughout

**Status:** ⚠️ **RECOMMENDED** - Not yet implemented

---

### 2. ESLint Import Rules (Future)
**Potential Rules:**
```json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "paths": [
          {
            "name": "@/lib/supabase/server",
            "importNames": ["createClient"],
            "message": "Routes should not create Supabase clients directly. Use services."
          }
        ],
        "patterns": [
          {
            "group": ["**/domain/**/*.repository"],
            "message": "Routes should not import repositories directly. Use services."
          }
        ]
      }
    ]
  }
}
```

**Status:** ⚠️ **FUTURE** - Can be added if needed

---

### 3. Architecture Tests (Future)
**Potential Tests:**
```typescript
// tests/architecture/layer-boundaries.test.ts
describe("Layer boundaries", () => {
  it("routes should not import repositories", () => {
    // Scan route files for repository imports
  });
  
  it("services should not import HTTP types", () => {
    // Scan service files for Request/Response imports
  });
});
```

**Status:** ⚠️ **FUTURE** - Can be added if needed

---

## Convention-Only Enforcement

### Current Conventions
1. **Service Layer Usage**
   - Routes must use services
   - Services must use repositories
   - **Enforcement:** Code review

2. **Tenant Context**
   - All tenant-scoped operations require context
   - **Enforcement:** Code review + TypeScript

3. **Authorization**
   - All operations check policies
   - **Enforcement:** Code review

4. **Error Handling**
   - Services return result objects
   - Routes map to HTTP responses
   - **Enforcement:** Code review

---

## How Future Code Must Be Written

### Route Handlers
```typescript
// ✅ CORRECT
export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  requireTenant(ctx);
  
  const supabase = await createClient();
  const { data, error } = await serviceMethod(supabase, ctx, input);
  
  if (error) {
    return NextResponse.json({ error }, { status: mapError(error) });
  }
  
  return NextResponse.json({ data });
}

// ❌ WRONG
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.from("table").select("*"); // ❌ Direct DB
  const enriched = data.map(transform); // ❌ Business logic
  return NextResponse.json({ data: enriched });
}
```

### Services
```typescript
// ✅ CORRECT
export async function serviceMethod(
  supabase: SupabaseClient,
  ctx: TenantContext,
  input: InputType
): Promise<{ data: OutputType | null; error: string }> {
  if (!canPerformAction(ctx)) {
    return { data: null, error: "Insufficient rights" };
  }
  
  const data = await repository.getById(supabase, ctx.tenantId, input.id);
  return { data, error: "" };
}

// ❌ WRONG
export async function serviceMethod(...) {
  const { data } = await supabase.from("table").select("*"); // ❌ Direct DB
  return { data, error: "" };
}
```

### Repositories
```typescript
// ✅ CORRECT
export async function getById(
  supabase: SupabaseClient,
  id: string,
  tenantId: string
): Promise<DomainType | null> {
  const { data, error } = await supabase
    .from("table")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  
  if (error || !data) return null;
  return data as DomainType;
}

// ❌ WRONG
export async function getById(...) {
  const { data } = await supabase.from("table").select("*"); // ❌ No tenant filter
  return data.filter(transform); // ❌ Business logic
}
```

---

## Enforcement Strategy

### Current (Convention-Based)
- ✅ Documentation
- ✅ Code patterns
- ✅ Type safety
- ✅ Code review

### Future (Automated)
- ⚠️ ESLint rules (optional)
- ⚠️ Architecture tests (optional)
- ⚠️ CI checks (optional)

---

## Recommendations

### Immediate
1. ✅ Documentation complete
2. ✅ Patterns established
3. ⚠️ Add code review checklist to PR template

### Future (Optional)
1. Add ESLint import boundary rules
2. Add architecture tests
3. Add CI checks for layer violations

---

## Summary

- **Documentation:** ✅ Complete
- **Patterns:** ✅ Established
- **Type Safety:** ✅ Enforced
- **Automated Rules:** ⚠️ Optional (can be added)
- **Code Review:** ✅ Primary enforcement

---

**Status:** ✅ **ESTABLISHED** - Guardrails in place via documentation and conventions
