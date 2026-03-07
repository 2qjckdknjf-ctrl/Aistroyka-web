# API Parity Report - Android vs Backend

## Overview

This document verifies that the Android platform clients correctly implement all backend API contracts without contract drift.

## Verification Method

1. DTOs match backend Zod schemas exactly
2. API endpoints match backend routes
3. Headers match backend requirements
4. Request/response formats match backend contracts
5. Error handling matches backend error format

## Backend API Base

- **Base URL**: `https://api.aistroyka.ai`
- **API Version**: `v1`
- **Response Format**: `{ data: T }` or `{ error: string, code?: string }`

## Shared DTOs

### ✅ Project DTOs

**Backend Schema**: `packages/contracts/src/schemas/projects.schema.ts`

**Android Implementation**: `android/shared/dto/src/main/java/com/aistroyka/shared/dto/ProjectDto.kt`

**Verification**:
- ✅ `ProjectDto` matches `ProjectSchema`
- ✅ `ProjectsListResponse` matches `ProjectsListResponseSchema`
- ✅ `CreateProjectRequest` matches `CreateProjectRequestSchema`
- ✅ `CreateProjectResponse` matches `CreateProjectResponseSchema`
- ✅ Snake_case mapping via `@SerializedName`

### ✅ Task DTOs

**Backend Schema**: Domain model in `apps/web/lib/domain/tasks/`

**Android Implementation**: `android/shared/dto/src/main/java/com/aistroyka/shared/dto/TaskDto.kt`

**Verification**:
- ✅ All fields match backend Task interface
- ✅ Optional fields properly nullable
- ✅ Snake_case mapping

### ✅ Report DTOs

**Backend Schema**: Domain model in `apps/web/lib/domain/reports/`

**Android Implementation**: `android/shared/dto/src/main/java/com/aistroyka/shared/dto/ReportDto.kt`

**Verification**:
- ✅ All fields match backend Report interface
- ✅ Request/response DTOs match backend contracts
- ✅ Snake_case mapping

### ✅ WorkerDay DTOs

**Backend Schema**: Domain model in `apps/web/lib/domain/worker-day/`

**Android Implementation**: `android/shared/dto/src/main/java/com/aistroyka/shared/dto/WorkerDayDto.kt`

**Verification**:
- ✅ All fields match backend WorkerDay interface
- ✅ Snake_case mapping

### ✅ Sync DTOs

**Backend Schema**: `packages/contracts/src/schemas/sync.schema.ts`

**Android Implementation**: `android/shared/dto/src/main/java/com/aistroyka/shared/dto/SyncDto.kt`

**Verification**:
- ✅ `SyncBootstrapResponse` matches `SyncBootstrapResponseSchema`
- ✅ `SyncChangesResponse` matches `SyncChangesResponseSchema`
- ✅ `SyncAckRequest` matches `SyncAckRequestSchema`
- ✅ `SyncAckResponse` matches `SyncAckResponseSchema`
- ✅ All nested DTOs match

### ✅ Config DTOs

**Backend Schema**: `packages/contracts/src/schemas/config.schema.ts`

**Android Implementation**: `android/shared/dto/src/main/java/com/aistroyka/shared/dto/ConfigDto.kt`

**Verification**:
- ✅ `ConfigPayload` matches `ConfigPayloadSchema`
- ✅ `ConfigFlag` matches `ConfigFlagSchema`

### ✅ Auth DTOs

**Backend**: Supabase Auth REST API

**Android Implementation**: `android/shared/dto/src/main/java/com/aistroyka/shared/dto/AuthDto.kt`

**Verification**:
- ✅ `LoginRequest` matches Supabase format
- ✅ `LoginResponse` matches Supabase format
- ✅ `ErrorResponse` matches backend error format

### ✅ Media DTOs

**Backend**: Domain model in `apps/web/lib/domain/upload-session/`

**Android Implementation**: `android/shared/dto/src/main/java/com/aistroyka/shared/dto/MediaDto.kt`

**Verification**:
- ✅ Upload session DTOs match backend
- ✅ Purpose enum values match

### ✅ AI DTOs

**Backend Schema**: `packages/contracts/src/schemas/ai.schema.ts`

**Android Implementation**: `android/shared/dto/src/main/java/com/aistroyka/shared/dto/AiDto.kt`

**Verification**:
- ✅ `AnalyzeImageRequest` matches `AnalyzeImageRequestSchema`
- ✅ `AnalysisResult` matches `AnalysisResult` schema

### ✅ Device DTOs

**Backend**: Domain model

**Android Implementation**: `android/shared/dto/src/main/java/com/aistroyka/shared/dto/DeviceDto.kt`

**Verification**:
- ✅ Device registration DTOs match backend

## API Endpoints

### ✅ Auth Endpoints

**Backend**: Supabase Auth REST API

**Android**: `android/shared/api-client/src/main/java/com/aistroyka/shared/api/ApiClient.kt`

- ✅ `POST /auth/v1/token?grant_type=password` - Login

### ✅ Config Endpoints

**Backend**: `GET /api/v1/config`

**Android**: Implemented in `ApiClient.getConfig()`

- ✅ Endpoint matches
- ✅ Headers: `Authorization` (optional)
- ✅ Response: `ConfigPayload`

### ✅ Project Endpoints

**Backend**: 
- `GET /api/v1/projects`
- `POST /api/v1/projects`

**Android**: Implemented in `ApiClient`

- ✅ `listProjects()` - GET endpoint
- ✅ `createProject()` - POST endpoint
- ✅ Headers: `Authorization`, `x-client: android_full`, `x-idempotency-key` (POST)
- ✅ Request/response match

### ✅ Worker Task Endpoints

**Backend**: `GET /api/v1/worker/tasks/today`

**Android**: Implemented in `ApiClient.getTodayTasks()`

- ✅ Endpoint matches
- ✅ Query param: `project_id` (optional)
- ✅ Headers: `Authorization`, `x-client: android_lite`
- ✅ Response: `TasksListResponse`

### ✅ Worker Day Endpoints

**Backend**:
- `POST /api/v1/worker/day/start`
- `POST /api/v1/worker/day/end`

**Android**: Implemented in `ApiClient`

- ✅ `startDay()` - POST /start
- ✅ `endDay()` - POST /end
- ✅ Headers: `Authorization`, `x-client: android_lite`, `x-idempotency-key`
- ✅ Response: `StartDayResponse` / `EndDayResponse`

### ✅ Report Endpoints

**Backend**:
- `POST /api/v1/worker/report/create`
- `POST /api/v1/worker/report/add-media`
- `POST /api/v1/worker/report/submit`

**Android**: Implemented in `ApiClient`

- ✅ `createReport()` - POST /create
- ✅ `addMediaToReport()` - POST /add-media
- ✅ `submitReport()` - POST /submit
- ✅ Headers: `Authorization`, `x-client: android_lite`, `x-idempotency-key`
- ✅ Request/response match

### ✅ Sync Endpoints

**Backend**:
- `GET /api/v1/sync/bootstrap`
- `GET /api/v1/sync/changes`
- `POST /api/v1/sync/ack`

**Android**: Implemented in `ApiClient`

- ✅ `syncBootstrap()` - GET /bootstrap
- ✅ `syncChanges()` - GET /changes
- ✅ `syncAck()` - POST /ack
- ✅ Headers: `Authorization`, `x-client`, `x-device-id`, `x-idempotency-key` (POST)
- ✅ Query params: `cursor`, `limit` (changes)
- ✅ Request/response match

### ✅ Media Endpoints

**Backend**:
- `POST /api/v1/media/upload-sessions`
- `POST /api/v1/media/upload-sessions/:id/finalize`

**Android**: Implemented in `ApiClient`

- ✅ `createUploadSession()` - POST /upload-sessions
- ✅ `finalizeUploadSession()` - POST /upload-sessions/:id/finalize
- ✅ Headers: `Authorization`, `x-client`, `x-idempotency-key`
- ✅ Request/response match

### ✅ AI Endpoints

**Backend**: `POST /api/v1/ai/analyze-image`

**Android**: Implemented in `ApiClient.analyzeImage()`

- ✅ Endpoint matches
- ✅ Headers: `Authorization` (optional)
- ✅ Request/response match

### ✅ Device Endpoints

**Backend**:
- `POST /api/v1/devices/register`
- `POST /api/v1/devices/unregister`

**Android**: Implemented in `ApiClient`

- ✅ `registerDevice()` - POST /register
- ✅ `unregisterDevice()` - POST /unregister
- ✅ Headers: `Authorization`, `x-client`, `x-idempotency-key`
- ✅ Request/response match

## Headers

### ✅ Required Headers

**Backend Requirements**:
- `Authorization: Bearer <token>` - JWT from Supabase
- `x-client: <profile>` - Client profile identifier
- `x-device-id: <uuid>` - Required for sync endpoints
- `x-idempotency-key: <uuid>` - Required for all write operations (mobile)

**Android Implementation**:
- ✅ All headers implemented in `ApiClient`
- ✅ Headers added via Retrofit `@Header` annotations
- ✅ Token from `TokenStorage`
- ✅ Device ID from `DeviceIdProvider`
- ✅ Idempotency keys from `IdempotencyKeyGenerator`

## Error Handling

### ✅ Error Response Format

**Backend Format**:
```json
{
  "error": "Error message",
  "code": "error_code"
}
```

**Android Implementation**:
- ✅ `ErrorResponse` DTO matches format
- ✅ `ApiErrorHandler` intercepts errors
- ✅ Maps HTTP status codes to `ApiError` sealed class
- ✅ Error codes preserved

### ✅ Status Code Mapping

**Backend Status Codes**:
- 400 Bad Request
- 401 Unauthorized
- 402 Payment Required
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 413 Payload Too Large
- 429 Rate Limited
- 500 Server Error

**Android Implementation**:
- ✅ All status codes mapped in `ApiErrorHandler`
- ✅ `ApiError` sealed class covers all cases
- ✅ Network errors handled separately

## Client Profiles

### ✅ Client Profile Headers

**Backend Profiles**:
- `ios_lite` / `android_lite` - Worker apps
- `ios_full` / `android_full` - Manager apps

**Android Implementation**:
- ✅ Worker app uses `android_lite`
- ✅ Manager app uses `android_full`
- ✅ Headers set correctly in all requests

## Idempotency

### ✅ Idempotency Keys

**Backend Requirement**:
- All write operations require `x-idempotency-key` header
- Keys should be UUIDs
- Backend deduplicates by key

**Android Implementation**:
- ✅ `IdempotencyKeyGenerator` generates UUIDs
- ✅ All POST/PATCH operations include idempotency key
- ✅ Keys generated per request

## Sync Implementation

### ✅ Sync Flow

**Backend Sync Pattern**:
1. Bootstrap → Initial snapshot + cursor
2. Changes → Delta changes with cursor
3. Ack → Acknowledge cursor

**Android Implementation**:
- ✅ `SyncService` implements full flow
- ✅ Cursor persistence via `SyncStorage`
- ✅ Conflict handling (409 → bootstrap)
- ✅ Matches iOS implementation

## Summary

### ✅ Contract Parity: 100%

All backend contracts are correctly implemented:
- ✅ All DTOs match backend schemas
- ✅ All API endpoints match backend routes
- ✅ All headers match backend requirements
- ✅ Error handling matches backend format
- ✅ Request/response formats match exactly
- ✅ No contract drift detected

### ✅ Client Profile Compliance

- ✅ Worker app uses `android_lite` correctly
- ✅ Manager app uses `android_full` correctly
- ✅ Profile restrictions understood (not enforced client-side)

### ✅ Best Practices

- ✅ Snake_case mapping via Gson
- ✅ Nullable types for optional fields
- ✅ Sealed classes for error handling
- ✅ Repository pattern for data access
- ✅ Dependency injection with Hilt

## Recommendations

1. **API Contract Tests**: Add automated tests to verify DTOs match backend schemas
2. **OpenAPI Codegen**: Consider generating DTOs from OpenAPI spec
3. **Versioning**: Monitor backend API version changes
4. **Documentation**: Keep DTOs documented with backend field descriptions
