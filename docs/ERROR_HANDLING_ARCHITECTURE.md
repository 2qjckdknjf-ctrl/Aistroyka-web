# Error Handling Architecture

**Date:** 2026-03-07  
**Stage:** 8 - Error Handling & Result Contracts

## Executive Summary

Error handling is **mostly consistent** but could benefit from standardization. Current pattern uses result objects `{ data, error }` in services, which is good. Route-level error mapping could be more standardized.

## Current Error Handling Patterns

### Service Layer Pattern
**Pattern:** Result objects with error strings
```typescript
return { data: OutputType | null; error: string }
```

**Examples:**
- ✅ `{ data: Project[]; error: string | null }`
- ✅ `{ data: Task | null; error: string }`
- ✅ `{ ok: boolean; error: string }`

**Strengths:**
- Explicit error handling
- No exceptions for expected errors
- Type-safe error results

**Weaknesses:**
- Error strings not typed
- Status codes not included
- Inconsistent error message formats

---

### Route Layer Pattern
**Pattern:** Try-catch with error mapping
```typescript
try {
  const { data, error } = await serviceMethod(...);
  if (error) {
    const status = mapErrorToStatus(error);
    return NextResponse.json({ error }, { status });
  }
  return NextResponse.json({ data });
} catch (err) {
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

**Status Mapping:**
- "Insufficient rights" → 403
- "Not found" → 404
- "Unauthorized" → 401
- "Invalid input" → 400
- Default → 500

**Strengths:**
- Consistent HTTP status mapping
- Graceful error handling

**Weaknesses:**
- Error message mapping not centralized
- Some routes have custom mapping logic

---

## Domain Error Types

### Current Error Categories
1. **Authorization Errors**
   - "Insufficient rights"
   - "Unauthorized"
   - "Tenant required"

2. **Validation Errors**
   - "Invalid input"
   - "Missing required field"
   - "Invalid format"

3. **Not Found Errors**
   - "Not found"
   - "Report not found"
   - "Project not found"

4. **Business Rule Errors**
   - "Report already submitted"
   - "Cannot revoke owner"
   - "Invitation expired"

5. **System Errors**
   - "Failed to create"
   - "Database connection failed"
   - "Internal server error"

---

## Error Mapping

### Current Mapping (Implicit)
```typescript
// Pattern found in routes
if (error === "Insufficient rights") return 403;
if (error === "Not found") return 404;
if (error === "Unauthorized") return 401;
// ... etc
```

### Recommended: Centralized Mapping
```typescript
// lib/api/error-mapper.ts
export function mapErrorToStatus(error: string): number {
  if (error.includes("Insufficient rights") || error.includes("Forbidden")) return 403;
  if (error.includes("Not found") || error.includes("not found")) return 404;
  if (error === "Unauthorized" || error.includes("Unauthorized")) return 401;
  if (error.includes("Invalid") || error.includes("required")) return 400;
  if (error.includes("Conflict") || error.includes("already exists")) return 409;
  if (error.includes("expired")) return 410;
  return 500;
}
```

---

## Result Contracts

### Service Result Pattern
**Standard:**
```typescript
{ data: T | null; error: string }
```

**Variations:**
- `{ data: T[]; total: number; error: string }` - List results
- `{ ok: boolean; error: string }` - Boolean operations
- `{ data: T | null; error: string; code?: string }` - With error codes
- `{ data: T | null; error: string; statusCode?: number }` - With HTTP status

**Recommendation:** Standardize on:
```typescript
{ data: T | null; error: string; code?: string }
```

---

## Error Codes

### Current Usage
- ✅ Some services return error codes (e.g., `code: "task_invalid"`)
- ⚠️ Not consistently used
- ⚠️ No centralized error code enum

### Recommended: Error Code Enum
```typescript
export enum ErrorCode {
  UNAUTHORIZED = "unauthorized",
  FORBIDDEN = "forbidden",
  NOT_FOUND = "not_found",
  VALIDATION_ERROR = "validation_error",
  BUSINESS_RULE_VIOLATION = "business_rule_violation",
  SYSTEM_ERROR = "system_error",
}
```

---

## Structured Error Responses

### Current Pattern
```typescript
NextResponse.json({ error: "Message" }, { status: 400 })
```

### Recommended Pattern
```typescript
NextResponse.json(
  { 
    error: "Message",
    code: "validation_error",
    details?: Record<string, unknown>
  },
  { status: 400 }
)
```

---

## Error Logging

### Current Pattern
- ✅ Structured logging in services
- ✅ Request IDs in logs
- ✅ Tenant context in logs
- ⚠️ Error logging not standardized

### Recommended
```typescript
logStructured({
  event: "error",
  error: error.message,
  error_code: error.code,
  tenant_id: ctx.tenantId,
  request_id: ctx.traceId,
  stack?: error.stack,
});
```

---

## Exception Handling

### Current Pattern
- ✅ Services use result objects (no exceptions for expected errors)
- ✅ Routes catch unexpected exceptions
- ⚠️ Some routes don't catch exceptions

### Recommended
```typescript
try {
  const result = await serviceMethod(...);
  return mapServiceResultToResponse(result);
} catch (err) {
  logStructured({ event: "unexpected_error", error: String(err) });
  return NextResponse.json(
    { error: "Internal server error", code: "system_error" },
    { status: 500 }
  );
}
```

---

## Recommendations

### Immediate
1. ✅ Current pattern is acceptable
2. ⚠️ Consider centralizing error mapping
3. ⚠️ Consider standardizing error codes

### Future (Optional)
1. Create error mapper utility
2. Create error code enum
3. Add structured error responses
4. Standardize error logging

---

## Summary

- **Error Handling:** ✅ Mostly consistent
- **Result Contracts:** ✅ Standardized pattern
- **Error Mapping:** ⚠️ Could be centralized
- **Error Codes:** ⚠️ Partially implemented
- **Exception Handling:** ✅ Properly handled

---

**Status:** ✅ **ADEQUATE** - Error handling works, improvements optional
