# Aistroyka Manager Android - Feature Specification

## Overview

The Manager Android app provides project managers, admins, and owners with tools to manage projects, tasks, review reports, and analyze construction data. It matches the capabilities of the web Manager interface.

## Application ID

`com.aistroyka.manager`

## Features

### 1. Authentication

**Screen**: Login Screen

**Functionality**:
- Email/password login
- Supabase Auth integration
- Session persistence
- Role-based access control

**User Flow**:
1. User enters email and password
2. App calls `/auth/v1/token?grant_type=password`
3. On success, stores token and navigates to Dashboard
4. On failure, displays error message

**Role Gating**:
- Only `owner`, `admin`, `member` roles can access Manager app
- `viewer` role is read-only

**Implementation**:
- `LoginScreen` - UI
- `LoginViewModel` - Business logic
- `AuthService` - API integration

### 2. Dashboard

**Screen**: Dashboard Screen

**Functionality**:
- KPI cards displaying:
  - Active Projects count
  - Pending Reports count
  - Active Tasks count
  - Team Members count
- Real-time metrics
- Quick actions

**API Endpoints** (Future):
```
GET /api/v1/admin/metrics
Headers: Authorization, x-client: android_full
```

**User Flow**:
1. App loads Dashboard on login
2. Fetches KPI data
3. Displays metrics in cards
4. User can navigate to detail screens

**Implementation**:
- `DashboardScreen` - UI
- `DashboardViewModel` - Business logic

### 3. Projects

**Screen**: Projects Screen

**Functionality**:
- List all projects
- Create new project
- Project detail view
- Project management

**API Endpoints**:
```
GET /api/v1/projects
Headers: Authorization, x-client: android_full

POST /api/v1/projects
Body: { name }
Headers: Authorization, x-client: android_full, x-idempotency-key
```

**User Flow**:
1. User navigates to Projects tab
2. App fetches projects list
3. Displays projects in cards
4. User taps "+ New" to create project
5. User enters project name
6. App creates project and refreshes list

**Implementation**:
- `ProjectsScreen` - UI
- `ProjectsViewModel` - Business logic
- `ProjectRepository` - Data access

**Role Permissions**:
- `owner`, `admin`, `member` can create projects
- `viewer` can only view

### 4. Tasks

**Screen**: Tasks Screen

**Functionality**:
- List all tasks
- Filter by project/status
- Task detail view
- Create task
- Assign task
- Update task status

**API Endpoints** (Future):
```
GET /api/v1/tasks
Headers: Authorization, x-client: android_full

POST /api/v1/tasks
Body: { title, project_id, assigned_to, due_date, ... }
Headers: Authorization, x-client: android_full, x-idempotency-key

PATCH /api/v1/tasks/:id
Body: { status, assigned_to, ... }
Headers: Authorization, x-client: android_full, x-idempotency-key
```

**User Flow**:
1. User navigates to Tasks tab
2. App fetches tasks list
3. Displays tasks in cards
4. User taps task to view details
5. User can create/assign/update tasks

**Implementation**:
- `TasksScreen` - UI
- `TasksViewModel` - Business logic
- `TaskRepository` - Data access (extended for manager)

**Role Permissions**:
- `owner`, `admin`, `member` can manage tasks
- `viewer` can only view

### 5. Reports Inbox

**Screen**: Reports Screen

**Functionality**:
- List pending reports
- Filter by status/project
- Report detail view
- Review/approve reports
- Reject reports

**API Endpoints** (Future):
```
GET /api/v1/reports
Headers: Authorization, x-client: android_full

GET /api/v1/reports/:id
Headers: Authorization, x-client: android_full

POST /api/v1/reports/:id/review
Body: { action: "approve" | "reject", comment? }
Headers: Authorization, x-client: android_full, x-idempotency-key
```

**User Flow**:
1. User navigates to Reports tab
2. App fetches pending reports
3. Displays reports in list
4. User taps report to view details
5. User reviews photos and details
6. User approves or rejects report

**Implementation**:
- `ReportsScreen` - UI
- `ReportsViewModel` - Business logic
- `ReportRepository` - Data access (extended for manager)

**Role Permissions**:
- `owner`, `admin`, `member` can review reports
- `viewer` can only view

### 6. Team Management

**Screen**: Team Screen

**Functionality**:
- List team members
- View worker details
- Worker activity
- Role management (admin only)

**API Endpoints** (Future):
```
GET /api/v1/team
Headers: Authorization, x-client: android_full

GET /api/v1/team/:id
Headers: Authorization, x-client: android_full
```

**User Flow**:
1. User navigates to Team tab
2. App fetches team members
3. Displays workers in list
4. User can view worker details

**Implementation**:
- `TeamScreen` - UI
- `TeamViewModel` - Business logic

**Role Permissions**:
- All roles can view team
- Only `owner`, `admin` can manage roles

### 7. AI Analysis

**Screen**: AI Screen

**Functionality**:
- Analyze construction images
- View analysis results
- Confidence scores
- Tags and insights

**API Endpoint**:
```
POST /api/v1/ai/analyze-image
Body: { image_url, prompt? }
Headers: Authorization (optional), x-client: android_full
```

**User Flow**:
1. User navigates to AI tab
2. User enters image URL (or selects image)
3. User taps "Analyze Image"
4. App calls AI endpoint
5. Displays analysis results

**Implementation**:
- `AiScreen` - UI
- `AiViewModel` - Business logic
- `ApiClient` - Direct API call

**Rate Limiting**:
- AI endpoint is rate-limited
- 402 Payment Required if quota exceeded

### 8. Notifications

**Functionality**:
- Push notification registration
- Notification inbox
- In-app notifications

**API Endpoint**:
```
POST /api/v1/devices/register
Body: { device_id, push_token, platform: "android", app_version }
Headers: Authorization, x-client: android_full, x-idempotency-key
```

**Implementation**:
- `PushNotificationService` - Token registration
- FCM integration (future)

## Navigation

### Tab Navigation

Bottom navigation bar with 6 tabs:
1. **Dashboard** - KPI overview
2. **Projects** - Project management
3. **Tasks** - Task management
4. **Reports** - Reports inbox
5. **Team** - Team management
6. **AI** - AI analysis

### Deep Navigation

- Projects → Project Detail
- Tasks → Task Detail → Create/Edit
- Reports → Report Detail → Review
- Team → Worker Detail

## Role-Based Access Control

### Roles

1. **Owner**: Full access to all features
2. **Admin**: Full access except billing
3. **Member**: Can create/manage resources
4. **Viewer**: Read-only access

### Permission Checks

UI elements are gated based on role:
- Create buttons (owner/admin/member only)
- Edit buttons (owner/admin/member only)
- Delete buttons (owner/admin only)
- Role management (owner/admin only)

**Implementation**:
- `TenantContext` - Role information
- Permission checks in ViewModels
- UI visibility based on permissions

## UI Components

### Material Design 3

- Cards for data display
- Bottom navigation for main sections
- Dialogs for creation/editing
- Lists for data display
- Progress indicators for loading
- Error messages for failures

### Theme

- Light/Dark mode support
- Material Design 3 color scheme
- Custom typography

## Data Flow

1. **View** → User interaction
2. **ViewModel** → Business logic + permission checks
3. **Repository** → Data access
4. **API Client** → HTTP requests
5. **Backend** → Processing
6. **Response** → Flow back through layers

## Error Handling

- Network errors → Retry with exponential backoff
- API errors → Display user-friendly messages
- 403 Forbidden → Show permission error
- 402 Payment Required → Show quota error
- Validation errors → Inline field errors

## Performance

- Lazy loading for lists
- Image caching (Coil)
- Coroutine-based async operations
- Flow for reactive state
- Pagination for large lists (future)

## Security

- Token storage (SharedPreferences, encrypted in production)
- Role-based access control
- HTTPS only
- Certificate pinning (future)
- Biometric auth (future)

## Testing

### Unit Tests
- ViewModel logic
- Repository methods
- Permission checks
- Error handling

### Integration Tests
- API client
- Auth flow
- Role gating

### UI Tests
- Login flow
- Navigation
- Permission gating
- CRUD operations

## Future Enhancements

1. **Task Management**: Full CRUD for tasks
2. **Report Review**: Approve/reject workflow
3. **Team Management**: Role assignment
4. **Analytics**: Charts and graphs
5. **Audit Logs**: View audit trail
6. **Billing**: Subscription management (owner only)
7. **Image Upload**: Direct image upload for AI
8. **Filters**: Advanced filtering for all lists
9. **Search**: Full-text search
10. **Export**: Export data to CSV/PDF

## API Parity

All endpoints match web Manager interface:
- ✅ `/api/v1/projects` (GET, POST)
- ✅ `/api/v1/ai/analyze-image`
- ✅ `/api/v1/config`
- ✅ `/api/v1/devices/register`
- 🔄 `/api/v1/tasks` (GET, POST, PATCH) - Future
- 🔄 `/api/v1/reports` (GET, POST) - Future
- 🔄 `/api/v1/team` (GET) - Future
- 🔄 `/api/v1/admin/*` - Future

## Client Profile

Manager app uses `android_full` client profile, which provides access to:
- All worker endpoints
- All manager endpoints
- Admin endpoints
- AI endpoints
- Sync endpoints
- Media endpoints
- Config
- Devices
- Auth

No restrictions compared to `android_lite`.
