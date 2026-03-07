# Aistroyka Worker Android - Feature Specification

## Overview

The Worker Android app provides field workers with tools to manage their shifts, view tasks, and create reports. It matches the capabilities of the iOS Worker app.

## Application ID

`com.aistroyka.worker`

## Features

### 1. Authentication

**Screen**: Login Screen

**Functionality**:
- Email/password login
- Supabase Auth integration
- Session persistence
- Auto-login on app restart (if token valid)

**User Flow**:
1. User enters email and password
2. App calls `/auth/v1/token?grant_type=password`
3. On success, stores token and navigates to Home
4. On failure, displays error message

**Implementation**:
- `LoginScreen` - UI
- `LoginViewModel` - Business logic
- `AuthService` - API integration

### 2. Today's Tasks

**Screen**: Home Screen

**Functionality**:
- Lists tasks assigned for today
- Optional project filter
- Task status display
- Tap to view task details

**API Endpoint**:
```
GET /api/v1/worker/tasks/today?project_id=<optional>
Headers: Authorization, x-client: android_lite
```

**User Flow**:
1. App loads on Home screen
2. Fetches today's tasks
3. Displays list of tasks
4. User taps task → navigates to Task Detail

**Implementation**:
- `HomeScreen` - UI
- `HomeViewModel` - Business logic
- `TaskRepository` - Data access

### 3. Shift Management

**Screen**: Home Screen

**Functionality**:
- Start shift button
- End shift button
- Display current shift status
- Show shift start time

**API Endpoints**:
```
POST /api/v1/worker/day/start
POST /api/v1/worker/day/end
Headers: Authorization, x-client: android_lite, x-idempotency-key
```

**User Flow**:
1. User taps "Start Shift"
2. App generates idempotency key
3. Calls start endpoint
4. Updates UI to show shift active
5. User taps "End Shift" when done

**Implementation**:
- `HomeScreen` - UI
- `HomeViewModel` - Business logic
- `WorkerDayRepository` - Data access

**Idempotency**:
- All write operations use idempotency keys
- Prevents duplicate shift starts/ends

### 4. Task Detail

**Screen**: Task Detail Screen

**Functionality**:
- Display task information
  - Title
  - Status
  - Project ID
  - Due date
  - Required photos
  - Report status
- Create report for task button

**User Flow**:
1. User taps task from Home
2. App navigates to Task Detail
3. Displays task information
4. User can create report for this task

**Implementation**:
- `TaskDetailScreen` - UI
- `TaskDetailViewModel` - Business logic

### 5. Report Creation

**Screen**: Report Create Screen

**Functionality**:
- Create new report
- Optional task ID linkage
- Optional day ID linkage
- Add media (photos)
- Submit report

**API Endpoints**:
```
POST /api/v1/worker/report/create
Body: { day_id?: string, task_id?: string }
Headers: Authorization, x-client: android_lite, x-idempotency-key

POST /api/v1/worker/report/add-media
Body: { report_id, upload_session_id, purpose }
Headers: Authorization, x-client: android_lite, x-idempotency-key

POST /api/v1/worker/report/submit
Body: { report_id }
Headers: Authorization, x-client: android_lite, x-idempotency-key
```

**User Flow**:
1. User taps "Create Report" from Home or Task Detail
2. Optionally enters task ID
3. Taps "Create Report"
4. App creates report
5. User can add photos (future: photo picker)
6. User submits report

**Media Upload Flow** (Future):
1. Create upload session via `/api/v1/media/upload-sessions`
2. Upload photo to Supabase storage (upload_path)
3. Finalize session via `/api/v1/media/upload-sessions/:id/finalize`
4. Add media to report via `/api/v1/worker/report/add-media`

**Implementation**:
- `ReportCreateScreen` - UI
- `ReportCreateViewModel` - Business logic
- `ReportRepository` - Data access

### 6. Offline Support

**Functionality**:
- Operation queue for offline writes
- Sync service integration
- Cursor-based sync

**Sync Flow**:
1. **Bootstrap**: Initial data snapshot
   ```
   GET /api/v1/sync/bootstrap
   Headers: Authorization, x-client: android_lite, x-device-id
   ```
2. **Changes**: Fetch delta changes
   ```
   GET /api/v1/sync/changes?cursor=<cursor>&limit=100
   Headers: Authorization, x-client: android_lite, x-device-id
   ```
3. **Ack**: Acknowledge cursor
   ```
   POST /api/v1/sync/ack
   Body: { cursor }
   Headers: Authorization, x-client: android_lite, x-device-id, x-idempotency-key
   ```

**Conflict Handling**:
- 409 Conflict → Must bootstrap
- App triggers bootstrap on conflict

**Implementation**:
- `SyncService` - Sync logic
- `SyncStorage` - Cursor persistence
- Operation queue (future: Room database)

### 7. Push Notifications

**Functionality**:
- FCM token registration
- Notification handling
- Background notifications

**API Endpoint**:
```
POST /api/v1/devices/register
Body: { device_id, push_token, platform: "android", app_version }
Headers: Authorization, x-client: android_lite, x-idempotency-key
```

**Implementation**:
- `PushNotificationService` - Token registration
- FCM integration (future)

## Navigation

### Navigation Graph

```
Login
  ↓ (on success)
Home
  ├─→ Task Detail
  │     └─→ Report Create
  └─→ Report Create
```

### Bottom Navigation

- Home (main screen)

## UI Components

### Material Design 3

- Cards for task display
- Buttons for actions
- Text fields for input
- Progress indicators for loading
- Error messages for failures

### Theme

- Light/Dark mode support
- Material Design 3 color scheme
- Custom typography

## Data Flow

1. **View** → User interaction
2. **ViewModel** → Business logic
3. **Repository** → Data access
4. **API Client** → HTTP requests
5. **Backend** → Processing
6. **Response** → Flow back through layers

## Error Handling

- Network errors → Retry with exponential backoff
- API errors → Display user-friendly messages
- Validation errors → Inline field errors
- Sync conflicts → Trigger bootstrap

## Performance

- Lazy loading for lists
- Image caching (Coil)
- Coroutine-based async operations
- Flow for reactive state

## Security

- Token storage (SharedPreferences, encrypted in production)
- Idempotency keys prevent duplicate operations
- HTTPS only
- Certificate pinning (future)

## Testing

### Unit Tests
- ViewModel logic
- Repository methods
- Error handling

### Integration Tests
- API client
- Auth flow
- Sync service

### UI Tests
- Login flow
- Task list
- Report creation

## Future Enhancements

1. **Photo Upload**: Full photo picker and upload implementation
2. **Offline Queue**: Room database for operation queue
3. **Background Sync**: WorkManager for periodic sync
4. **Biometric Auth**: Fingerprint/Face unlock
5. **Project Picker**: Filter tasks by project
6. **Report History**: View past reports
7. **Task Comments**: Add comments to tasks
8. **Location Tracking**: GPS location for reports

## API Parity

All endpoints match iOS Worker app:
- ✅ `/api/v1/worker/tasks/today`
- ✅ `/api/v1/worker/day/start`
- ✅ `/api/v1/worker/day/end`
- ✅ `/api/v1/worker/report/create`
- ✅ `/api/v1/worker/report/add-media`
- ✅ `/api/v1/worker/report/submit`
- ✅ `/api/v1/sync/bootstrap`
- ✅ `/api/v1/sync/changes`
- ✅ `/api/v1/sync/ack`
- ✅ `/api/v1/media/upload-sessions`
- ✅ `/api/v1/devices/register`

## Client Profile

Worker app uses `android_lite` client profile, which restricts API access to:
- Worker endpoints
- Sync endpoints
- Media upload sessions
- Config
- Devices
- Auth

Manager endpoints are not accessible.
