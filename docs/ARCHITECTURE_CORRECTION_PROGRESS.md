# Architecture Correction Progress

**Date:** 2026-03-07  
**Stage:** 2 - Architecture Correction

## Summary

Systematic refactoring to enforce clean layered architecture:
- UI → API → Auth/Tenant → Domain Services → Repositories → Platform Layer → Providers

## Fixed Violations

### ✅ Device Management (COMPLETED)

**Created:**
- `lib/domain/devices/device.repository.ts` - Device token repository
- `lib/domain/devices/device.service.ts` - Device service with proper validation

**Fixed Routes:**
- ✅ `app/api/v1/devices/register/route.ts` - Now uses `registerDevice` service
- ✅ `app/api/v1/devices/unregister/route.ts` - Now uses `unregisterDevice` service
- ✅ `app/api/v1/devices/route.ts` - Now uses `listDevices` service
- ✅ `app/api/v1/sync/changes/route.ts` - Now uses `updateDeviceLastSeen` service
- ✅ `app/api/v1/sync/ack/route.ts` - Now uses `updateDeviceLastSeen` service

## Remaining Violations

### 🔴 HIGH PRIORITY - Security & Tenant Isolation

1. **Missing Tenant Context Checks:**
   - `app/api/projects/[id]/upload/route.ts` - Uses old auth pattern
   - `app/api/projects/[id]/poll-status/route.ts` - No tenant context check
   - `app/api/tenant/*` routes - May be intentional, but need verification

2. **Direct DB Calls in Routes (Security Risk):**
   - `app/api/v1/reports/route.ts` - Direct queries to `worker_report_media` and `jobs`
   - `app/api/v1/workers/[userId]/days/route.ts` - Direct query to `worker_day`
   - `app/api/v1/workers/[userId]/summary/route.ts` - Direct queries
   - `app/api/v1/worker/sync/route.ts` - Direct queries
   - `app/api/v1/media/[mediaId]/*` routes - Direct queries to `photo_annotations`, `photo_comments`
   - `app/api/tenant/*` routes - Direct queries to `tenant_invitations`, `tenant_members`

### 🟡 MEDIUM PRIORITY - Business Logic in Routes

1. **Business Logic Should Be in Services:**
   - `app/api/v1/reports/route.ts` - Enrichment logic (media count, analysis status)
   - `app/api/v1/ai/requests/route.ts` - Filtering/searching logic
   - `app/api/v1/workers/[userId]/days/route.ts` - Date filtering logic
   - `app/api/projects/[id]/upload/route.ts` - Bucket creation logic

### 🟢 LOW PRIORITY - Code Organization

1. **UI Components with Direct DB Calls:**
   - Multiple dashboard pages with direct Supabase queries
   - Should use API endpoints or data fetching hooks

## Next Steps

1. Create domain services for:
   - Worker days/summary
   - Media annotations/comments
   - Tenant invitations/members
   - Report enrichment

2. Fix missing tenant context checks

3. Move business logic from routes to services

4. Refactor UI components to use API endpoints

---

**Status:** In Progress (5/30+ violations fixed)
