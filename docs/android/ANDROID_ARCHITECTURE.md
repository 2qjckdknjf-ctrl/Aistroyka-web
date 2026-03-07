# Android Platform Architecture

## Overview

The Android platform for Aistroyka consists of two separate applications:
- **Aistroyka Worker (Android)** - Worker-focused mobile app
- **Aistroyka Manager (Android)** - Management and oversight mobile app

Both apps share a common core module (`android/shared`) that provides:
- API client implementation
- Authentication services
- Data models (DTOs)
- Repository patterns
- Sync service
- Error handling
- Device context management

## Architecture Principles

1. **No Backend Contract Duplication**: All DTOs mirror backend contracts exactly
2. **Shared Core**: Business logic and API integration live in shared modules
3. **Clean Architecture**: Separation of concerns with MVVM pattern
4. **Offline-First**: Worker app supports offline operation with sync
5. **Role-Based Access**: Manager app enforces role gating

## Directory Structure

```
android/
├── shared/                    # Shared core modules
│   ├── api-client/           # Retrofit API client
│   ├── auth/                 # Authentication service
│   ├── config/               # Config service
│   ├── device-context/       # Device ID, idempotency keys
│   ├── dto/                  # Data Transfer Objects (mirror backend)
│   ├── error-mapping/        # API error handling
│   ├── logging/              # Centralized logging
│   ├── notifications/        # Push notification service
│   ├── repositories/         # Data repositories
│   ├── sync/                 # Sync service (bootstrap/changes/ack)
│   └── tenant-context/       # Tenant context management
├── worker/                    # Worker Android app
│   └── src/main/java/com/aistroyka/worker/
│       ├── ui/
│       │   ├── navigation/   # Compose Navigation
│       │   ├── screens/      # UI screens
│       │   └── theme/        # Material Design theme
│       ├── MainActivity.kt
│       └── WorkerApplication.kt
└── manager/                   # Manager Android app
    └── src/main/java/com/aistroyka/manager/
        ├── ui/
        │   ├── navigation/   # Tab navigation
        │   ├── screens/      # UI screens
        │   └── theme/        # Material Design theme
        ├── MainActivity.kt
        └── ManagerApplication.kt
```

## Tech Stack

- **Language**: Kotlin
- **UI Framework**: Jetpack Compose
- **Architecture**: Clean Architecture + MVVM
- **Dependency Injection**: Hilt
- **Networking**: Retrofit 2.9.0
- **Async**: Coroutines + Flow
- **Image Loading**: Coil
- **Navigation**: Compose Navigation

## Shared Core Modules

### API Client (`shared/api-client`)

Retrofit-based HTTP client that mirrors all backend endpoints:
- Auth endpoints
- Worker endpoints (tasks, day, reports)
- Manager endpoints (projects, tasks, reports, team)
- Sync endpoints (bootstrap, changes, ack)
- Media upload sessions
- AI analysis
- Device registration

**Key Features**:
- Bearer token authentication
- Client profile headers (`x-client`: `android_lite` or `android_full`)
- Device ID headers (`x-device-id`) for sync endpoints
- Idempotency keys (`x-idempotency-key`) for all write operations
- Error handling via interceptors

### Authentication (`shared/auth`)

Implements Supabase Auth via REST API:
- Email/password login
- Token storage (SharedPreferences)
- Auth state management (Flow)
- User session management

### Sync Service (`shared/repositories`)

Implements cursor-based sync matching iOS:
1. **Bootstrap**: Initial snapshot + cursor
2. **Changes**: Delta changes with cursor pagination
3. **Ack**: Acknowledge cursor position

**Features**:
- Cursor persistence
- Conflict detection (409 → must bootstrap)
- Offline-first support

### Repositories

Data access layer:
- `TaskRepository` - Task operations
- `ProjectRepository` - Project CRUD
- `ReportRepository` - Report creation/submission
- `WorkerDayRepository` - Shift management

### DTOs (`shared/dto`)

All DTOs match backend contracts exactly:
- `ProjectDto`, `TaskDto`, `ReportDto`
- `WorkerDayDto`, `SyncDto`
- `ConfigDto`, `AuthDto`, `MediaDto`
- `AiDto`, `DeviceDto`

Uses Gson with `@SerializedName` for snake_case mapping.

## Worker App

### Features

1. **Authentication**
   - Email/password login
   - Session persistence

2. **Shift Management**
   - Start/end shift
   - Idempotent operations

3. **Today's Tasks**
   - List tasks for current day
   - Filter by project
   - Task detail view

4. **Report Creation**
   - Create report (with optional task/day linkage)
   - Add media (photos)
   - Submit report
   - Offline queue support

5. **Offline Support**
   - Operation queue
   - Sync service integration
   - Cursor-based sync

6. **Push Notifications**
   - FCM token registration
   - Notification handling

### Navigation

Bottom navigation with:
- Home (shift, tasks, create report)

Deep navigation:
- Login → Home
- Home → Task Detail
- Home → Report Create

## Manager App

### Features

1. **Dashboard**
   - KPI cards (projects, tasks, reports, team)
   - Real-time metrics

2. **Projects**
   - List all projects
   - Create project
   - Project detail view

3. **Tasks**
   - List all tasks
   - Task detail
   - Create/assign tasks
   - Task status management

4. **Reports Inbox**
   - List pending reports
   - Report detail
   - Review/approve reports

5. **Team Management**
   - List team members
   - Worker management

6. **AI Analysis**
   - Image analysis
   - Construction intelligence

7. **Notifications**
   - Inbox
   - Push notifications

8. **Role Gating**
   - Owner/Admin/Member/Viewer permissions
   - UI element visibility based on role

### Navigation

Tab navigation with:
- Dashboard
- Projects
- Tasks
- Reports
- Team
- AI

Deep links between modules supported.

## API Integration

### Client Profiles

- `android_lite` - Worker app (restricted API access)
- `android_full` - Manager app (full API access)

### Headers

All requests include:
- `Authorization: Bearer <token>` - JWT from Supabase
- `x-client: android_lite | android_full` - Client profile
- `x-device-id: <uuid>` - Required for sync endpoints
- `x-idempotency-key: <uuid>` - Required for all write operations

### Error Handling

Error responses follow backend format:
```json
{
  "error": "Error message",
  "code": "error_code"
}
```

Mapped to `ApiError` sealed class:
- `BadRequest` (400)
- `Unauthorized` (401)
- `PaymentRequired` (402)
- `Forbidden` (403)
- `NotFound` (404)
- `Conflict` (409) - Sync conflicts
- `PayloadTooLarge` (413)
- `RateLimited` (429)
- `ServerError` (500)
- `NetworkError` - Network failures
- `UnknownError` - Other errors

## Offline Support (Worker)

1. **Operation Queue**: Stores write operations when offline
2. **Sync Service**: Bootstrap → Changes → Ack loop
3. **Cursor Persistence**: Tracks sync position
4. **Conflict Resolution**: 409 responses trigger bootstrap

## Security

- Token storage in SharedPreferences (encrypted in production)
- Idempotency keys prevent duplicate writes
- Role-based access control
- Client profile restrictions

## Testing

- Unit tests for ViewModels
- Integration tests for repositories
- UI tests for critical flows
- API contract tests

## Build Configuration

- **Min SDK**: 24 (Android 7.0)
- **Target SDK**: 34 (Android 14)
- **Compile SDK**: 34
- **Java Version**: 17
- **Kotlin**: 1.9.20

## Dependencies

See `build.gradle.kts` files for complete dependency list.

Key dependencies:
- Compose BOM: 2023.10.01
- Hilt: 2.48
- Retrofit: 2.9.0
- Coroutines: 1.7.3
- Navigation: 2.7.5

## Future Enhancements

1. **Offline Storage**: Room database for local caching
2. **Image Upload**: Background upload service
3. **Biometric Auth**: Fingerprint/Face unlock
4. **Dark Mode**: Full dark theme support
5. **Accessibility**: Screen reader support
6. **Internationalization**: Multi-language support
