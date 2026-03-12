# API Foundation

## Overview

The app already has a rich set of routes under **`app/api/`**: `v1/projects`, `v1/tasks`, `v1/reports`, `v1/worker/*`, `v1/me`, `v1/org/*`, `v1/admin/*`, etc. This document describes patterns and direction for a consistent platform API foundation.

## Current Patterns

- **Auth:** `getTenantContextFromRequest(request)`, `requireTenant(ctx)`; tenant-scoped access.
- **Responses:** `NextResponse.json({ data: ... })` or `NextResponse.json({ error: ... }, { status })`.
- **Route layout:** `app/api/v1/<resource>/[id]/route.ts`; dynamic segments via `context.params` (Promise in Next 15).

## Direction for Platform API

1. **Route grouping:** Keep `v1` as the current version; new platform capabilities (e.g. insights, copilot) can live under `v1/projects/[id]/insights`, `v1/copilot`, etc., without breaking existing clients.
2. **Auth boundary:** Continue using tenant context; add API-key or machine-auth abstraction later without changing existing session-based auth.
3. **Versioning:** New breaking resources can use `v2` or a new path prefix when needed.
4. **Response shape:** Prefer `{ data: T }` for success and `{ error: string }` for errors; use consistent status codes (400, 401, 403, 404, 500).
5. **Pagination:** Use `limit`/`offset` or `cursor` where already established; document conventions for new list endpoints.
6. **Webhooks:** Incoming webhook scaffold at `app/api/webhooks/incoming`; signing and replay protection to be added.

## What Was Added

- **`app/api/webhooks/incoming/route.ts`** — POST placeholder; accepts JSON and returns `{ received, eventType }`; no persistence or signing yet.

## Not Done (Intentional)

- No fake public API; no duplicate routes. New endpoints (e.g. manager insights, executive summary) can be added as thin wrappers over `lib/ai-brain/use-cases` when product is ready.
