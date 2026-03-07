# Architecture Duplication Cleanup

**Date:** 2026-03-07  
**Stage:** 10 - Duplication & Dead Path Elimination

## Executive Summary

Codebase shows **minimal duplication** after refactoring. Some duplicate business logic patterns identified but most have been consolidated. Dead code is minimal (archive/legacy-app is intentional).

## Duplicate Logic Patterns

### 1. Status Aggregation Logic
**Found in:**
- `report-list.service.ts` (lines 59-69)
- `report.service.ts` (lines 41-50 in getAnalysisStatus)

**Pattern:**
```typescript
// Job status aggregation
const byStatus: Record<string, number> = {};
for (const j of jobs) {
  byStatus[j.status] = (byStatus[j.status] ?? 0) + 1;
}
let status: AnalysisStatus = "queued";
if (byStatus.running) status = "running";
// ... more status logic
```

**Recommendation:**
- Extract to shared utility: `lib/domain/reports/job-status-aggregator.ts`
- Function: `aggregateJobStatus(jobs: Job[]): AnalysisStatus`

**Priority:** Low - Works as-is, improvement optional

---

### 2. Tenant Validation Pattern
**Found in:** Multiple services

**Pattern:**
```typescript
if (!ctx.tenantId) {
  return { data: null, error: "Unauthorized" };
}
```

**Status:** ✅ **ACCEPTABLE** - Consistent pattern, not duplication

---

### 3. Policy Check Pattern
**Found in:** All services

**Pattern:**
```typescript
if (!canPerformAction(ctx)) {
  return { data: null, error: "Insufficient rights" };
}
```

**Status:** ✅ **ACCEPTABLE** - Consistent pattern, not duplication

---

## Dead Code

### Archive Directory
**Location:** `archive/legacy-app/`

**Status:** ✅ **INTENTIONAL** - Legacy code preserved for reference

**Recommendation:** Keep as-is

---

### Commented Code Blocks
**Found:** Minimal

**Status:** ✅ **CLEAN** - No major commented blocks found

---

## Legacy Compatibility Layers

### Deprecated API Endpoints
**Found:**
- `/api/projects` (legacy)
- `/api/v1/projects` (current)

**Status:** ✅ **INTENTIONAL** - Backward compatibility

**Pattern:**
```typescript
// Legacy route delegates to current route
export { GET, POST } from "@/app/api/v1/projects/route";
```

**Recommendation:** Keep for backward compatibility

---

## Temporary Hacks

### Build Scripts
**Found:**
- `fix-standalone-for-opennext.cjs`
- `ensure-styled-jsx-dist.cjs`

**Status:** ⚠️ **WORKAROUND** - Required for OpenNext compatibility

**Recommendation:** Keep until OpenNext fully supports Next.js 15

---

## Shadow Implementations

### None Found
- ✅ No duplicate service implementations
- ✅ No duplicate repository implementations
- ✅ No duplicate provider implementations

---

## Code Quality Issues

### Console Logs
**Found:** Minimal (mostly in test files)

**Status:** ✅ **CLEAN** - Production code uses structured logging

---

### TODO/FIXME Comments
**Found:** Minimal

**Status:** ✅ **CLEAN** - No critical TODOs found

---

## Recommendations

### Immediate
1. ✅ No critical duplication found
2. ✅ Dead code minimal
3. ⚠️ Consider extracting status aggregation utility (optional)

### Future (Optional)
1. Extract job status aggregation to shared utility
2. Remove legacy API endpoints when no longer needed
3. Simplify build scripts when OpenNext supports Next.js 15

---

## Summary

- **Duplicate Logic:** 1 pattern (status aggregation) - Low priority
- **Dead Code:** Minimal (archive is intentional)
- **Temporary Hacks:** Build scripts (justified)
- **Shadow Implementations:** None
- **Code Quality:** ✅ Clean

---

**Status:** ✅ **CLEAN** - Minimal duplication, no critical issues
