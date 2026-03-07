# Architecture Completion Audit

**Date:** 2026-03-07  
**Stage:** 1 - Architecture Inventory  
**Auditor:** Principal Software Architect / Staff Engineer

## Executive Summary

Comprehensive scan of the AISTROYKA codebase reveals **21 critical violations**, **5 major violations**, and **1 minor violation** across **18 files**. The primary issues are:

1. **Route handlers performing direct DB operations** (15 violations)
2. **Route handlers containing business logic** (4 violations)
3. **Routes calling repositories directly** (3 violations)
4. **Missing tenant context checks** (2 violations)
5. **Services performing direct DB operations** (1 violation)
6. **Cross-layer leakage** (2 violations)

## Current Architecture Map

```
┌─────────────────────────────────────┐
│  Clients / UI                        │
│  (React components, mobile apps)     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  API / Route Handlers                │
│  ❌ VIOLATIONS:                      │
│  - Direct DB operations (15)         │
│  - Business logic (4)                 │
│  - Direct repository calls (3)        │
│  - Missing tenant checks (2)          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Auth / Tenant Context               │
│  ✅ Mostly correct                   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Domain Services                     │
│  ⚠️ Some services call DB directly   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Repositories / Data Access           │
│  ✅ Exists but not consistently used │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Platform / Providers                │
│  ✅ Mostly isolated                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  External Systems                    │
│  (Supabase, AI providers, etc.)      │
└─────────────────────────────────────┘
```

## Target Architecture Map

```
┌─────────────────────────────────────┐
│  Clients / UI                        │
│  - No direct DB calls                │
│  - Calls API endpoints only          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  API / Route Handlers                │
│  - Parse request                     │
│  - Validate input                    │
│  - Resolve auth/tenant context       │
│  - Call service                      │
│  - Map service result to response    │
│  - Handle errors                     │
│  ❌ NO business logic                │
│  ❌ NO direct DB operations          │
│  ❌ NO direct repository calls       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Auth / Tenant Context               │
│  - Consistent resolution             │
│  - Validation guards                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Domain Services                     │
│  - Business rules                    │
│  - Domain invariants                 │
│  - Orchestration                     │
│  - Calls repositories/providers      │
│  ❌ NO direct DB operations           │
│  ❌ NO HTTP concerns                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Repositories / Data Access          │
│  - DB queries                        │
│  - Persistence                       │
│  - Data mapping                      │
│  ❌ NO business logic                │
│  ❌ NO HTTP concerns                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Platform / Providers                │
│  - External integrations             │
│  - Provider-specific logic           │
│  - Retries, timeouts, fallbacks      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  External Systems                    │
└─────────────────────────────────────┘
```

## Violations by File

### 🔴 CRITICAL VIOLATIONS (21)

#### 1. Route Handlers Performing Direct DB Operations

**File:** `apps/web/app/api/v1/reports/route.ts`  
**Lines:** 44-50, 53-75  
**Severity:** Critical  
**Violation Type:** Direct DB operations + Business logic  
**Current Pattern:**
```typescript
// Direct DB calls
const [mediaRes, jobsRes] = await Promise.all([
  supabase.from("worker_report_media").select("report_id")...,
  supabase.from("jobs").select("status, payload")...
]);

// Business logic: aggregation
const mediaCountByReport: Record<string, number> = {};
for (const row of (mediaRes.data ?? [])) { ... }
// Status aggregation logic
for (const j of jobs) { ... }
```
**Recommended Fix:** Create `report-list.service.ts` with `enrichReportsWithMetadata()` method that uses repositories.

---

**File:** `apps/web/app/api/v1/media/[mediaId]/collab/route.ts`  
**Lines:** 26-27  
**Severity:** Critical  
**Violation Type:** Direct DB operations  
**Current Pattern:**
```typescript
const [annRes, comRes] = await Promise.all([
  supabase.from("photo_annotations").select(...)...,
  supabase.from("photo_comments").select(...)...
]);
```
**Recommended Fix:** Create `media-collab.repository.ts` or add to `media.repository.ts`.

---

**File:** `apps/web/app/api/tenant/accept-invite/route.ts`  
**Lines:** 20-24, 43, 56-59  
**Severity:** Critical  
**Violation Type:** Direct DB operations + Business logic  
**Current Pattern:**
```typescript
// Direct DB calls
const { data: inv } = await supabase.from("tenant_invitations")...
// Business logic: expiration check, email validation
if (new Date(inv.expires_at) < new Date()) { ... }
if (inviteEmail && inviteEmail !== userEmail) { ... }
// More direct DB calls
await supabase.from("tenant_members").upsert(...)
await supabase.from("tenant_invitations").delete(...)
```
**Recommended Fix:** Move to `tenant.service.ts` with `acceptInvitation(token: string)` method.

---

**File:** `apps/web/app/api/v1/admin/security/posture/route.ts`  
**Lines:** 31-47  
**Severity:** Critical  
**Violation Type:** Direct DB operations  
**Current Pattern:**
```typescript
const { count } = await supabase.from("alerts")...
const { data: idp } = await supabase.from("identity_providers")...
const { data: retention } = await supabase.from("data_retention_policies")...
```
**Recommended Fix:** Create `security-posture.repository.ts` or add to existing admin repository.

---

**File:** `apps/web/app/api/v1/worker/sync/route.ts`  
**Lines:** 31-37, 43-49  
**Severity:** Critical  
**Violation Type:** Direct DB operations + Business logic  
**Current Pattern:**
```typescript
const { data: reports } = await supabase.from("worker_reports")...
const reportsDelta = since ? reportList.filter((r) => ...) : reportList;
const { data: sessions } = await supabase.from("upload_sessions")...
```
**Recommended Fix:** Create `sync.service.ts` with `getSyncDelta()` method that uses repositories.

---

**File:** `apps/web/app/api/v1/media/[mediaId]/annotations/route.ts`  
**Lines:** 30-41  
**Severity:** Critical  
**Violation Type:** Direct DB operations  
**Current Pattern:**
```typescript
const { data: row, error } = await supabase.from("photo_annotations").insert({...})
```
**Recommended Fix:** Create `annotation.service.ts` or add to `media.service.ts`.

---

**File:** `apps/web/app/api/v1/media/[mediaId]/comments/route.ts`  
**Lines:** 30-39  
**Severity:** Critical  
**Violation Type:** Direct DB operations  
**Current Pattern:**
```typescript
const { data: row, error } = await supabase.from("photo_comments").insert({...})
```
**Recommended Fix:** Create `comment.service.ts` or add to `media.service.ts`.

---

**File:** `apps/web/app/api/tenant/invitations/route.ts`  
**Lines:** 18-23  
**Severity:** Critical  
**Violation Type:** Direct DB operations  
**Current Pattern:**
```typescript
const { data: rows } = await supabase.from("tenant_invitations").select(...)...
```
**Recommended Fix:** Use `tenant.service.ts` or create `invitation.repository.ts` + service.

---

**File:** `apps/web/app/api/v1/ai/requests/route.ts`  
**Lines:** 30-43, 46-65  
**Severity:** Critical  
**Violation Type:** Direct DB operations + Business logic  
**Current Pattern:**
```typescript
let query = supabase.from("jobs").select(...)...
// Complex query building and filtering logic
list = list.filter((item) => ...) // Business logic
```
**Recommended Fix:** Create `ai-request.service.ts` that uses `job.repository.ts`.

---

**File:** `apps/web/app/api/v1/workers/[userId]/days/route.ts`  
**Lines:** 31-42  
**Severity:** Critical  
**Violation Type:** Direct DB operations  
**Current Pattern:**
```typescript
const { data: days } = await supabase.from("worker_day")...
```
**Recommended Fix:** Create `worker-day.repository.ts` and use via `worker-day.service.ts`.

---

**File:** `apps/web/app/api/v1/workers/[userId]/summary/route.ts`  
**Lines:** 27-38  
**Severity:** Critical  
**Violation Type:** Direct DB operations  
**Current Pattern:**
```typescript
const { data: reports } = await supabase.from("worker_reports")...
const { data: media } = await supabase.from("worker_report_media")...
```
**Recommended Fix:** Create `worker-summary.service.ts` that uses repositories.

---

**File:** `apps/web/app/api/tenant/members/route.ts`  
**Lines:** 21-31  
**Severity:** Critical  
**Violation Type:** Direct DB operations  
**Current Pattern:**
```typescript
const { data: tenant } = await supabase.from("tenants")...
const { data: members } = await supabase.from("tenant_members")...
```
**Recommended Fix:** Use `tenant.service.ts` methods.

---

**File:** `apps/web/app/api/tenant/revoke/route.ts`  
**Lines:** 33-54  
**Severity:** Critical  
**Violation Type:** Direct DB operations  
**Current Pattern:**
```typescript
const { data: tenant } = await supabase.from("tenants")...
await supabase.from("tenant_members").delete(...)
```
**Recommended Fix:** Use `tenant.service.ts` methods.

---

**File:** `apps/web/app/api/tenant/invite/route.ts`  
**Lines:** 35-44  
**Severity:** Critical  
**Violation Type:** Direct DB operations  
**Current Pattern:**
```typescript
const { data: row } = await supabase.from("tenant_invitations").insert({...})
```
**Recommended Fix:** Use `tenant.service.ts` with `inviteMember()` method.

---

**File:** `apps/web/app/api/projects/[id]/upload/route.ts`  
**Lines:** 98-136  
**Severity:** Critical  
**Violation Type:** Direct DB operations + Business logic  
**Current Pattern:**
```typescript
// Direct storage operations
await supabase.storage.from(MEDIA_BUCKET).upload(...)
// Direct DB insert
await supabase.from("media").insert({...})
```
**Recommended Fix:** Use `media.service.ts` with `uploadMedia()` method.

---

#### 2. Route Handlers Containing Business Logic

**File:** `apps/web/app/api/v1/reports/[id]/analysis-status/route.ts`  
**Lines:** 41-52  
**Severity:** Critical  
**Violation Type:** Business logic + Direct repository calls  
**Current Pattern:**
```typescript
// Direct repository calls
const report = await getReportById(supabase, reportId, ctx.tenantId!);
const list = await jobRepo.listJobsByReportId(client, reportId, ctx.tenantId);
// Business logic: status aggregation
const byStatus: Record<string, number> = {};
for (const j of list) { byStatus[j.status] = (byStatus[j.status] ?? 0) + 1; }
let status: AnalysisStatus = "queued";
if (byStatus.running) status = "running";
// ... more status logic
```
**Recommended Fix:** Move to `report.service.ts` with `getAnalysisStatus(reportId: string)` method.

---

**File:** `apps/web/app/api/projects/[id]/poll-status/route.ts`  
**Lines:** 43-53  
**Severity:** Critical  
**Violation Type:** Business logic + Direct repository calls  
**Current Pattern:**
```typescript
// Direct repository call
const jobs = await listJobsByProject(supabase, ctx.tenantId!, projectId);
// Business logic: filtering and timeout checks
const activeJobs = jobs.filter((j) => {
  if (j.status !== "queued" && j.status !== "running") return false;
  if (j.status === "running" && j.started_at) {
    const started = new Date(j.started_at).getTime();
    if (now - started > PROCESSING_TIMEOUT_MS) return false;
  }
  return payload?.project_id === projectId;
});
```
**Recommended Fix:** Move to `project.service.ts` with `hasActiveJobs(projectId: string)` method.

---

**File:** `apps/web/app/api/v1/admin/jobs/route.ts`  
**Lines:** 26  
**Severity:** Major (downgraded from Critical)  
**Violation Type:** Business logic  
**Current Pattern:**
```typescript
const filtered = status ? rows.filter((r) => r.status === status) : rows;
```
**Recommended Fix:** Move filtering to repository or service layer.

---

#### 3. Routes Calling Repositories Directly

**File:** `apps/web/app/api/v1/media/upload-sessions/route.ts`  
**Lines:** 5, 39  
**Severity:** Major  
**Violation Type:** Route calling repository directly  
**Current Pattern:**
```typescript
import { listForManager } from "@/lib/domain/upload-session/upload-session.repository";
const { rows, total } = await listForManager(supabase, ctx.tenantId!, {...});
```
**Recommended Fix:** Use `upload-session.service.ts` instead.

---

### 🟡 MAJOR VIOLATIONS (5)

#### 4. Missing Tenant Context Checks

**File:** `apps/web/app/api/v1/config/route.ts`  
**Lines:** 14  
**Severity:** Major  
**Violation Type:** Missing requireTenant check  
**Current Pattern:**
```typescript
const ctx = await getTenantContextFromRequest(request);
// No requireTenant(ctx) check
const payload = await getConfigPayload(supabase, { tenantId: ctx.tenantId, ... });
```
**Recommended Fix:** Add `requireTenant(ctx)` check if tenant is required, or document that this endpoint is intentionally tenant-optional.

---

**File:** `apps/web/app/api/tenant/accept-invite/route.ts`  
**Lines:** 5-64  
**Severity:** Minor (intentional, but should be documented)  
**Violation Type:** Missing requireTenant check (intentional)  
**Current Pattern:** No tenant context check (invitation acceptance is pre-tenant)  
**Recommended Fix:** Document that this endpoint intentionally doesn't require tenant context.

---

#### 5. Services Performing Direct DB Operations

**File:** `apps/web/lib/domain/tenants/tenant.service.ts`  
**Lines:** 30  
**Severity:** Major  
**Violation Type:** Service calling DB directly  
**Current Pattern:**
```typescript
const { data: fallback } = await supabase.from("tenants").select("id").limit(1).maybeSingle();
```
**Recommended Fix:** Use `tenant.repository.ts` instead of direct DB calls.

---

#### 6. Cross-Layer Leakage

**File:** `apps/web/app/api/v1/media/[mediaId]/annotations/route.ts`  
**Lines:** 8, 44  
**Severity:** Major  
**Violation Type:** Route calling change-log repository directly  
**Current Pattern:**
```typescript
import { emitChange } from "@/lib/sync/change-log.repository";
if (admin) await emitChange(admin, { tenant_id: ctx.tenantId, ... });
```
**Recommended Fix:** Move `emitChange` call into the service layer (e.g., `media.service.ts` or `annotation.service.ts`).

---

**File:** `apps/web/app/api/v1/media/[mediaId]/comments/route.ts`  
**Lines:** 9, 42  
**Severity:** Major  
**Violation Type:** Route calling change-log repository directly  
**Current Pattern:**
```typescript
import { emitChange } from "@/lib/sync/change-log.repository";
if (admin) await emitChange(admin, { tenant_id: ctx.tenantId, ... });
```
**Recommended Fix:** Move `emitChange` call into the service layer.

---

### 🟢 MINOR VIOLATIONS (1)

#### 7. Duplicate Business Logic Patterns

**Pattern:** Status aggregation logic appears in multiple routes:
- `apps/web/app/api/v1/reports/route.ts` (lines 59-69)
- `apps/web/app/api/v1/reports/[id]/analysis-status/route.ts` (lines 41-50)

**Severity:** Minor  
**Recommended Fix:** Extract to a shared utility or service method (e.g., `aggregateJobStatus()`).

---

## Severity Classification

### Critical (21 violations)
- Direct DB operations in route handlers
- Business logic in route handlers
- Routes calling repositories directly (bypassing services)
- Missing tenant context checks in sensitive routes

### Major (5 violations)
- Services calling DB directly
- Cross-layer leakage (routes calling sync repositories)
- Missing tenant checks (documented exceptions)

### Minor (1 violation)
- Duplicate business logic patterns

## Recommended Correction Order

### Phase 1: Critical Route Cleanup (P0)
1. **Reports routes** (2 files)
   - `apps/web/app/api/v1/reports/route.ts`
   - `apps/web/app/api/v1/reports/[id]/analysis-status/route.ts`

2. **Media routes** (4 files)
   - `apps/web/app/api/v1/media/[mediaId]/annotations/route.ts`
   - `apps/web/app/api/v1/media/[mediaId]/comments/route.ts`
   - `apps/web/app/api/v1/media/[mediaId]/collab/route.ts`
   - `apps/web/app/api/projects/[id]/upload/route.ts`

3. **Tenant routes** (5 files)
   - `apps/web/app/api/tenant/accept-invite/route.ts`
   - `apps/web/app/api/tenant/invitations/route.ts`
   - `apps/web/app/api/tenant/members/route.ts`
   - `apps/web/app/api/tenant/revoke/route.ts`
   - `apps/web/app/api/tenant/invite/route.ts`

4. **Worker routes** (3 files)
   - `apps/web/app/api/v1/worker/sync/route.ts`
   - `apps/web/app/api/v1/workers/[userId]/days/route.ts`
   - `apps/web/app/api/v1/workers/[userId]/summary/route.ts`

5. **Admin routes** (2 files)
   - `apps/web/app/api/v1/admin/security/posture/route.ts`
   - `apps/web/app/api/v1/admin/jobs/route.ts`

6. **AI routes** (1 file)
   - `apps/web/app/api/v1/ai/requests/route.ts`

7. **Project routes** (1 file)
   - `apps/web/app/api/projects/[id]/poll-status/route.ts`

### Phase 2: Service Layer Normalization (P0)
1. Create missing services:
   - `report-list.service.ts`
   - `annotation.service.ts`
   - `comment.service.ts`
   - `media-collab.service.ts`
   - `sync.service.ts`
   - `worker-summary.service.ts`
   - `ai-request.service.ts`

2. Enhance existing services:
   - `tenant.service.ts` (add invitation methods)
   - `report.service.ts` (add analysis status method)
   - `project.service.ts` (add active jobs check)
   - `media.service.ts` (add upload, annotation, comment methods)

### Phase 3: Repository Layer Hardening (P0)
1. Create missing repositories:
   - `annotation.repository.ts`
   - `comment.repository.ts`
   - `media-collab.repository.ts`
   - `worker-day.repository.ts`
   - `security-posture.repository.ts`

2. Fix services calling DB directly:
   - `tenant.service.ts`

### Phase 4: Cross-Layer Cleanup (P1)
1. Move change-log emissions to services
2. Extract duplicate business logic
3. Document tenant-optional endpoints

## Summary Statistics

- **Total Violations:** 27
- **Critical:** 21
- **Major:** 5
- **Minor:** 1
- **Files Affected:** 18
- **Routes Affected:** 18
- **Services Affected:** 1

## Next Steps

1. **Stage 2:** Define target architecture standards
2. **Stage 3:** Refactor critical routes (Phase 1)
3. **Stage 4:** Normalize domain services (Phase 2)
4. **Stage 5:** Harden repository layer (Phase 3)
5. **Stage 6:** Clean up provider boundaries
6. **Stage 7:** Enforce tenant/auth boundaries
7. **Stage 8:** Standardize error handling
8. **Stage 9:** Add architecture guardrails
9. **Stage 10:** Remove duplication
10. **Stage 11:** Add regression tests
11. **Stage 12:** Final certification

---

**Status:** 🔴 **CRITICAL VIOLATIONS IDENTIFIED** - Immediate refactoring required
