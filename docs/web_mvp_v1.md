# Aistroyka Web Functional MVP v1

Working production-grade web app: minimal UI, full functionality. Next.js 14 (App Router), TypeScript, Tailwind, Supabase Auth, Supabase RPC integration.

---

## Folder structure

```
app/
  layout.tsx                    # Root layout
  page.tsx                      # Home: redirect /dashboard or /login
  globals.css

  (auth)/
    login/page.tsx
    register/page.tsx

  (dashboard)/
    layout.tsx                  # Auth check, Nav, tenant context
    dashboard/page.tsx          # Recent projects table
    projects/
      page.tsx                  # Projects table + create form
      CreateProjectForm.tsx
      UploadMediaForm.tsx
      JobStatusBadge.tsx
      TriggerAnalysisButton.tsx
      JobListPolling.tsx
      [id]/page.tsx             # Project detail: upload, jobs, analysis
    billing/page.tsx            # Read-only billing table
    admin/page.tsx              # Job monitor table

  api/
    projects/
      route.ts                  # POST create project
      [id]/
        upload/route.ts        # POST upload media, create job + media
        jobs/
          [jobId]/
            trigger/route.ts   # POST trigger AI analysis (RPC)

components/
  Nav.tsx
  NavLogout.tsx

lib/
  types.ts                      # Project, Job, AiAnalysis, MediaItem, JobWithAnalysis
  supabase/
    client.ts
    server.ts
    middleware.ts
    rpc.ts                      # createProject, listProjectsForUser, getProjectById, triggerAnalysis

middleware.ts                   # Session refresh, protected vs auth redirects
```

---

## API integration

### Supabase

- **Auth**: Supabase Auth (email/password). Session in cookies via `@supabase/ssr`. Middleware refreshes session and redirects unauthenticated users from protected routes.
- **Client**: `lib/supabase/client.ts` (browser).
- **Server**: `lib/supabase/server.ts` (RSC and Route Handlers).
- **Tenant isolation**: RLS on `projects`, `jobs`, `media`, `ai_analysis`. All queries use the authenticated user; no tenant id in URLs.

### RPC layer (`lib/supabase/rpc.ts`)

| Function | Purpose |
|----------|---------|
| `createProject(supabase, name)` | Insert project for current user. Can be replaced by RPC `create_project(p_name text)` returns uuid. |
| `listProjectsForUser(supabase)` | Select projects where user_id = auth.uid(). Can be replaced by RPC `get_projects_for_user()`. |
| `getProjectById(supabase, projectId)` | Select project by id (RLS enforces owner). |
| `triggerAnalysis(supabase, projectId, jobId)` | Verifies project ownership, calls RPC `trigger_analysis(p_job_id uuid)`. Backend must implement this RPC to start analysis. |

### HTTP API routes

| Method + Path | Purpose |
|---------------|---------|
| POST `/api/projects` | Body `{ "name": string }`. Uses `createProject()`. Returns `{ "id": string }`. |
| POST `/api/projects/[id]/upload` | multipart/form-data with `file`. Upload to bucket `project-media`, insert job (pending) + media. Returns `{ "jobId", "path" }`. |
| POST `/api/projects/[id]/jobs/[jobId]/trigger` | Calls `triggerAnalysis()`. Returns `{ "ok": true }` or `{ "error": string }`. |

### Billing (read-only)

- Billing page selects from table `public.billing` with columns `id`, `plan`, `status`, `current_period_end`. If the table does not exist or returns no rows, the page shows an empty table with “No billing records.”

---

## State management

- **Server state**: All list and detail data is fetched in Server Components via `createClient()` from `lib/supabase/server`. No global store. Each page load gets fresh data; RLS enforces tenant isolation.
- **Auth state**: Session is in cookies. Middleware runs on each request and refreshes the session. Dashboard layout reads user and passes email to Nav.
- **Client state (forms)**: Login, register, create project, upload media, trigger analysis use local component state (`useState`) and `useRouter().refresh()` after success to refetch server data.
- **Polling**: On project detail, when any job has status `pending` or `processing`, the client component `JobListPolling` runs `router.refresh()` every 3 seconds so job status and analysis results update without full page reload. No separate client cache; server is the source of truth.

---

## Features implemented

| Feature | Implementation |
|---------|----------------|
| Auth (login/register) | Supabase Auth; `/login`, `/register`; middleware redirects. |
| Dashboard | Table: Name, Created, Action (Open). Recent projects, link to all. |
| Projects list | Table: Name, Created, Action. Create project form. |
| Project detail | Upload media (file input → API upload). Per-job “Trigger analysis” for pending jobs. Job list with status badge, error, and AI analysis result (stage, completion %, risk, issues, recommendations). |
| Trigger AI analysis | Button calls POST `/api/projects/[id]/jobs/[jobId]/trigger` → RPC `trigger_analysis(p_job_id)`. |
| Poll job status | `JobListPolling` refreshes page every 3s while any job is pending/processing. |
| Display analysis result | Rendered from `jobs` with nested `ai_analysis` in project detail. |
| Billing | Read-only table from `public.billing` (or empty state). |
| Admin | Read-only table of jobs (Job ID, Project ID, Status, Created, Error). |

---

## Env vars

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |

---

## Supabase schema (existing)

Tables: `projects` (id, name, user_id, created_at), `jobs` (id, project_id, status, error_message, created_at, updated_at), `media` (id, project_id, job_id, path, created_at), `ai_analysis` (id, job_id, stage, completion_percent, risk_level, detected_issues, recommendations, created_at). RLS as in project docs. Storage bucket `project-media`. Optional: `billing` (id, plan, status, current_period_end) for billing page. RPC required for trigger: `trigger_analysis(p_job_id uuid)`.
