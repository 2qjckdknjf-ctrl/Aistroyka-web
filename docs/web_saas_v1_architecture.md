# Aistroyka Web SaaS v1 — Architecture

Production-ready frontend for the AI construction intelligence platform. Next.js 14 (App Router), TypeScript, Tailwind, Supabase Auth, Supabase RPC/database integration.

---

## Folder structure

```
AISTROYKA-WEB/
├── app/
│   ├── layout.tsx                 # Root layout (metadata, globals)
│   ├── page.tsx                   # Home: redirect to /dashboard or /login
│   ├── globals.css
│   │
│   ├── (auth)/                    # Route group: auth pages (no dashboard shell)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/               # Route group: tenant-aware layout (Nav + user)
│   │   ├── layout.tsx             # Ensures user, renders Nav, wraps children
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   ├── CreateProjectForm.tsx
│   │   │   ├── UploadMediaForm.tsx
│   │   │   ├── JobStatusBadge.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── billing/
│   │   │   └── page.tsx
│   │   └── admin/
│   │       └── page.tsx
│   │
│   └── api/
│       └── projects/
│           ├── route.ts           # POST: create project (uses RPC layer)
│           └── [id]/
│               └── upload/
│                   └── route.ts  # POST: upload media, create job + media row
│
├── components/
│   ├── Nav.tsx                    # App nav (links + optional user email + logout)
│   └── NavLogout.tsx              # Client logout button
│
├── lib/
│   ├── types.ts                   # Project, Job, AiAnalysis, MediaItem, JobWithAnalysis
│   └── supabase/
│       ├── client.ts              # Browser Supabase client (@supabase/ssr)
│       ├── server.ts              # Server Supabase client (cookies)
│       ├── middleware.ts         # Session refresh (getUser)
│       └── rpc.ts                 # RPC integration layer (createProject, listProjects, getProject)
│
├── middleware.ts                  # Auth redirects: protected vs auth routes
├── docs/
│   ├── web_mvp_v1.md
│   └── web_saas_v1_architecture.md
└── ...
```

---

## Routing structure

| Path | Route group | Purpose | Auth |
|------|-------------|---------|------|
| `/` | (root) | Redirect to `/dashboard` or `/login` | — |
| `/login` | (auth) | Sign in (email/password) | Public |
| `/register` | (auth) | Sign up | Public |
| `/dashboard` | (dashboard) | Overview, recent projects | Protected |
| `/projects` | (dashboard) | List projects, create project | Protected |
| `/projects/[id]` | (dashboard) | Project detail: upload media, jobs, AI analysis | Protected |
| `/billing` | (dashboard) | Billing placeholder | Protected |
| `/admin` | (dashboard) | Read-only list of all jobs | Protected |

- **Protected routes**: unauthenticated users are redirected to `/login?next=<path>`.
- **Auth routes**: authenticated users are redirected to `next` or `/dashboard`.
- **Tenant**: current user (`auth.uid()`). All data access is tenant-scoped via RLS; the dashboard layout displays the current user (email) in the nav.

---

## API integration model

### Supabase usage

- **Auth**: Supabase Auth (email/password). Session in cookies via `@supabase/ssr`; middleware refreshes session.
- **Client**: `lib/supabase/client.ts` (browser).
- **Server**: `lib/supabase/server.ts` (RSC and Route Handlers).
- **Tenant isolation**: Row Level Security (RLS) on `projects`, `jobs`, `media`, `ai_analysis`. No tenant id passed in URLs; all queries use the authenticated user; RLS enforces `user_id` / project ownership.

### RPC layer (`lib/supabase/rpc.ts`)

Single integration surface for tenant-scoped operations. Implementations use direct table access today; when the backend exposes RPCs, switch to `supabase.rpc('name', params)` here and keep the same function signatures.

| Function | Purpose | Current implementation | Possible RPC |
|----------|---------|-------------------------|--------------|
| `createProject(supabase, name)` | Create project for current user | `projects.insert` + `user_id` from auth | `create_project(p_name text) returns uuid` |
| `listProjectsForUser(supabase)` | List projects for current user | `projects.select().eq('user_id', user.id)` | `get_projects_for_user()` |
| `getProjectById(supabase, projectId)` | Get project by id (RLS enforces owner) | `projects.select().eq('id', id).single()` | Optional RPC |

### Next.js API routes (HTTP)

- **POST `/api/projects`**  
  Body: `{ "name": string }`.  
  Uses `createProject()` from RPC layer. Returns `{ "id": string }` or `{ "error": string }`.

- **POST `/api/projects/[id]/upload`**  
  Body: `multipart/form-data` with `file` (image).  
  Verifies project ownership, uploads to Supabase Storage bucket `project-media`, creates `jobs` row (status `pending`) and `media` row. Returns `{ "jobId", "path" }`.

Server components that need project list or single project can use the RPC layer (e.g. `listProjectsForUser`, `getProjectById`) or direct Supabase selects; both respect RLS.

---

## Data flow (tenant-aware)

1. User signs in → Supabase Auth sets session cookie.
2. Middleware runs on each request → refreshes session, redirects unauthenticated from protected paths.
3. Dashboard layout runs for `/dashboard`, `/projects`, etc. → gets user, renders Nav (with email), then children.
4. Pages and API routes use `createClient()` (server) or `createClient()` (client); RLS limits rows to the current user’s data.
5. Project create: form → `POST /api/projects` → `createProject(supabase, name)` → insert with `user_id`.
6. Upload: form → `POST /api/projects/[id]/upload` → check project ownership → storage upload → insert job + media.

---

## Env vars

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |

See `.env.example`.
