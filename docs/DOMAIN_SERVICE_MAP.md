# Domain Service Map

**Date:** 2026-03-07  
**Stage:** 4 - Domain Service Normalization

## Overview

Complete map of all domain services, their responsibilities, inputs/outputs, dependencies, and invariants.

## Service Inventory

### 1. Device Service
**Location:** `lib/domain/devices/device.service.ts`

**Responsibility:**
- Device token registration and management
- Device listing and unregistration
- Device last-seen updates

**Methods:**
- `registerDevice()` - Register device token for push notifications
- `listDevices()` - List devices for tenant/user
- `unregisterDevice()` - Remove device token
- `updateDeviceLastSeen()` - Update device last-seen timestamp

**Inputs:**
- `SupabaseClient`, `TenantContext`, `deviceId`, `platform`, `token`

**Outputs:**
- `{ success: boolean; error?: string }` or `{ data: DeviceToken[]; error: string | null }`

**Dependencies:**
- `device.repository.ts` - Data access

**Invariants:**
- Tenant context must be validated
- Device tokens are tenant-scoped
- Push tokens never exposed to non-owners

---

### 2. Project Service
**Location:** `lib/domain/projects/project.service.ts`

**Responsibility:**
- Project CRUD operations
- Project access control
- Active jobs checking

**Methods:**
- `listProjects()` - List projects for tenant
- `getProject()` - Get project by ID
- `createProject()` - Create new project
- `hasActiveJobs()` - Check if project has active AI analysis jobs

**Inputs:**
- `SupabaseClient`, `TenantContext`, `projectId?`, `name?`

**Outputs:**
- `{ data: Project[]; error: string | null }` or `{ id: string } | { error: string }` or `{ hasActiveJobs: boolean; error: string | null }`

**Dependencies:**
- `project.repository.ts` - Data access
- `project.policy.ts` - Authorization policies
- `job.repository.ts` - Job queries (for hasActiveJobs)

**Invariants:**
- Projects are tenant-scoped
- Project names max 200 characters
- Only members+ can create projects

---

### 3. Task Service
**Location:** `lib/domain/tasks/task.service.ts`

**Responsibility:**
- Task CRUD operations
- Task assignment
- Task filtering and listing

**Methods:**
- `listTasks()` - List tasks with filters
- `listTasksForToday()` - List tasks for today (worker view)
- `createTask()` - Create new task
- `updateTask()` - Update existing task
- `getTaskById()` - Get task with reports
- `assignTask()` - Assign task to worker

**Inputs:**
- `SupabaseClient`, `TenantContext`, `taskId?`, `input?`, `workerId?`, `filters?`

**Outputs:**
- `{ data: Task[]; total: number; error: string }` or `{ data: Task | null; error: string }` or `{ error: string }`

**Dependencies:**
- `task.repository.ts` - Data access
- `task-assignments.repository.ts` - Assignment data
- `task.policy.ts` - Authorization policies

**Invariants:**
- Tasks are tenant-scoped
- Only managers+ can create/assign tasks
- Task assignments tracked separately

---

### 4. Report Service
**Location:** `lib/domain/reports/report.service.ts`

**Responsibility:**
- Report creation and management
- Report submission with AI job enqueueing
- Media attachment to reports
- Analysis status tracking

**Methods:**
- `createReport()` - Create new report
- `addMediaToReport()` - Add media to report
- `submitReport()` - Submit report and enqueue AI jobs
- `getAnalysisStatus()` - Get AI analysis status for report
- `validateTaskForReportLink()` - Validate task assignment for report

**Inputs:**
- `SupabaseClient`, `TenantContext`, `reportId?`, `options?`, `opts?`, `traceId?`

**Outputs:**
- `{ data: Report | null; error: string; code?: string }` or `{ ok: boolean; error: string; code?: string; jobIds?: string[] }` or `{ data: AnalysisStatusResult | null; error: string }`

**Dependencies:**
- `report.repository.ts` - Data access
- `task.repository.ts` - Task validation
- `task-assignments` - Assignment checking
- `job.service.ts` - Job enqueueing
- `audit.service.ts` - Audit logging
- `change-log.repository.ts` - Sync events
- `job.repository.ts` - Job queries

**Invariants:**
- Reports are tenant-scoped
- Only workers can create/submit their own reports
- Reports must be in draft status to add media
- Task validation required for task-linked reports

---

### 5. Report List Service
**Location:** `lib/domain/reports/report-list.service.ts`

**Responsibility:**
- Report listing with metadata enrichment
- Media count and analysis status aggregation

**Methods:**
- `listReportsWithMetadata()` - List reports with enrichment

**Inputs:**
- `SupabaseClient`, `TenantContext`, `filters: ListReportsFilters & { statusFilter?: string }`

**Outputs:**
- `{ data: EnrichedReport[]; error: string | null }`

**Dependencies:**
- `report-list.repository.ts` - Base report listing
- Direct DB queries for enrichment (media count, job status)

**Invariants:**
- Reports are tenant-scoped
- Enrichment uses parallel queries for performance

---

### 6. Media Service
**Location:** `lib/domain/media/media.service.ts`

**Responsibility:**
- Media file management
- Upload session handling

**Methods:**
- (Existing methods - needs verification)

**Dependencies:**
- `media.repository.ts` - Data access

---

### 7. Annotation Service
**Location:** `lib/domain/media/annotation.service.ts`

**Responsibility:**
- Photo annotation CRUD
- Change-log emission for sync

**Methods:**
- `createAnnotation()` - Create annotation
- `getAnnotation()` - Get annotation by ID
- `updateAnnotation()` - Update annotation with version checking
- `deleteAnnotation()` - Delete annotation
- `listAnnotations()` - List annotations for media

**Inputs:**
- `SupabaseClient`, `TenantContext`, `mediaId`, `annotationId?`, `type?`, `data?`, `expectedVersion?`, `updates?`

**Outputs:**
- `{ data: PhotoAnnotation | null; error: string; statusCode?: number }` or `{ ok: boolean; error: string }` or `{ data: PhotoAnnotation[]; error: string }`

**Dependencies:**
- `annotation.repository.ts` - Data access
- `change-log.repository.ts` - Sync events

**Invariants:**
- Annotations are tenant-scoped
- Version checking for updates (optimistic locking)
- Change-log events emitted on create/update

---

### 8. Comment Service
**Location:** `lib/domain/media/comment.service.ts`

**Responsibility:**
- Photo comment creation and listing
- Change-log emission for sync

**Methods:**
- `createComment()` - Create comment
- `listComments()` - List comments for media

**Inputs:**
- `SupabaseClient`, `TenantContext`, `mediaId`, `body?`

**Outputs:**
- `{ data: PhotoComment | null; error: string }` or `{ data: PhotoComment[]; error: string }`

**Dependencies:**
- `comment.repository.ts` - Data access
- `change-log.repository.ts` - Sync events

**Invariants:**
- Comments are tenant-scoped
- Comments are append-only
- Change-log events emitted on create

---

### 9. Media Collab Service
**Location:** `lib/domain/media/media-collab.service.ts`

**Responsibility:**
- Fetch annotations and comments for media

**Methods:**
- `getMediaCollab()` - Get collaboration data (annotations + comments)

**Inputs:**
- `SupabaseClient`, `TenantContext`, `mediaId`

**Outputs:**
- `{ data: MediaCollabData | null; error: string }`

**Dependencies:**
- `media-collab.repository.ts` - Data access

**Invariants:**
- Data is tenant-scoped
- Parallel queries for performance

---

### 10. Upload Session Service
**Location:** `lib/domain/upload-session/upload-session.service.ts`

**Responsibility:**
- Upload session creation and management
- Session finalization with storage verification
- Session listing

**Methods:**
- `createUploadSession()` - Create upload session
- `finalizeUploadSession()` - Finalize session with storage verification
- `listUploadSessions()` - List sessions with filters

**Inputs:**
- `SupabaseClient`, `TenantContext`, `purpose?`, `sessionId?`, `payload?`, `filters?`

**Outputs:**
- `{ data: UploadSession & { upload_path: string } | null; error: string }` or `{ ok: boolean; error: string }` or `{ data: UploadSession[]; total: number; error: string }`

**Dependencies:**
- `upload-session.repository.ts` - Data access
- `upload-session.policy.ts` - Authorization policies
- `change-log.repository.ts` - Sync events

**Invariants:**
- Sessions are tenant-scoped
- Path validation for security
- Storage verification optional (configurable)

---

### 11. Worker Day Service
**Location:** `lib/domain/worker-day/worker-day.service.ts`

**Responsibility:**
- Worker day start/end tracking
- Worker day listing

**Methods:**
- `startDay()` - Start work day
- `endDay()` - End work day
- `listDaysForUser()` - List days for user

**Inputs:**
- `SupabaseClient`, `TenantContext`, `userId?`, `filters?`

**Outputs:**
- `{ data: WorkerDay | null; error: string }` or `{ data: WorkerDay[]; error: string }`

**Dependencies:**
- `worker-day.repository.ts` - Data access
- `worker-day.policy.ts` - Authorization policies

**Invariants:**
- Days are tenant-scoped
- One day per user per date
- Only workers can manage their own days

---

### 12. Worker Summary Service
**Location:** `lib/domain/workers/worker-summary.service.ts`

**Responsibility:**
- Worker statistics aggregation

**Methods:**
- `getWorkerSummary()` - Get reports and media counts for worker

**Inputs:**
- `SupabaseClient`, `TenantContext`, `userId`

**Outputs:**
- `{ data: WorkerSummary | null; error: string }`

**Dependencies:**
- `worker-summary.repository.ts` - Data access

**Invariants:**
- Statistics are tenant-scoped
- Parallel queries for performance

---

### 13. Worker Sync Service
**Location:** `lib/domain/sync/worker-sync.service.ts`

**Responsibility:**
- Worker sync delta generation
- Tasks, reports, upload sessions since timestamp

**Methods:**
- `getWorkerSyncDelta()` - Get sync delta for worker

**Inputs:**
- `SupabaseClient`, `TenantContext`, `since?`

**Outputs:**
- `{ data: WorkerSyncData; error: string }`

**Dependencies:**
- `worker-sync.repository.ts` - Data access
- `task.service.ts` - Task listing

**Invariants:**
- Sync data is tenant-scoped
- Delta filtering based on timestamp
- Parallel queries for performance

---

### 14. Tenant Service
**Location:** `lib/domain/tenants/tenant.service.ts`

**Responsibility:**
- Tenant resolution and creation
- Tenant member management
- Invitation management

**Methods:**
- `getOrCreateTenantForUser()` - Resolve or create tenant for user
- `getTenant()` - Get tenant by ID
- `inviteMember()` - Invite member to tenant
- `listMembers()` - List tenant members
- `listInvitations()` - List tenant invitations
- `acceptInvitation()` - Accept tenant invitation
- `revokeMembership()` - Revoke tenant membership

**Inputs:**
- `SupabaseClient`, `TenantContext?`, `tenantId?`, `input?`, `userId?`, `token?`, `targetUserId?`

**Outputs:**
- Various result types depending on method

**Dependencies:**
- `tenant.repository.ts` - Data access
- `invitation.repository.ts` - Invitation data
- `audit.service.ts` - Audit logging
- `app-url.ts` - URL generation

**Invariants:**
- Tenants are user-owned or membership-based
- Invitations expire after 7 days
- Only owners/admins can invite/revoke
- Cannot revoke tenant owner

---

## Service Patterns

### Standard Service Pattern
```typescript
export async function serviceMethod(
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

### Service Responsibilities
1. **Authorization** - Policy checks via `*.policy.ts`
2. **Input Validation** - Type and business rule validation
3. **Business Logic** - Domain rules and transformations
4. **Orchestration** - Coordinate repositories and other services
5. **Side Effects** - Change-log, audit, job enqueueing

### Service Dependencies
- ✅ Repositories - Data access
- ✅ Policy modules - Authorization
- ✅ Other services - Cross-domain coordination
- ✅ Platform services - Jobs, audit, change-log
- ❌ Direct DB operations - Must use repositories
- ❌ HTTP concerns - No Request/Response types
- ❌ UI components - No React/UI imports

## Service Cohesion

### Well-Cohesive Services
- ✅ `device.service.ts` - Single responsibility (device management)
- ✅ `annotation.service.ts` - Single responsibility (annotations)
- ✅ `comment.service.ts` - Single responsibility (comments)
- ✅ `worker-day.service.ts` - Single responsibility (day tracking)

### Services Needing Review
- ⚠️ `tenant.service.ts` - Multiple responsibilities (tenant + members + invitations)
  - **Recommendation:** Consider splitting into `tenant.service.ts`, `tenant-member.service.ts`, `tenant-invitation.service.ts`

## Duplicate Logic Elimination

### Status Aggregation
- **Found in:** `report-list.service.ts`, `report.service.ts`
- **Pattern:** Job status aggregation logic
- **Recommendation:** Extract to shared utility `aggregateJobStatus()`

### Tenant Validation
- **Found in:** Multiple services
- **Pattern:** `if (!ctx.tenantId) return { data: null, error: "Unauthorized" }`
- **Status:** ✅ Consistent pattern, acceptable

## Service Invariants

### Tenant Isolation
- All services validate tenant context
- All repository calls include `tenantId`
- No cross-tenant data access

### Authorization
- All services check policies before operations
- Role-based access enforced
- Resource ownership validated

### Data Integrity
- Input validation in services
- Business rules enforced
- Transaction boundaries respected

## Next Steps

1. Extract duplicate status aggregation logic
2. Consider splitting `tenant.service.ts` (optional)
3. Continue to Stage 5: Repository Layer Hardening

---

**Status:** ✅ **NORMALIZED** - Services follow consistent patterns
