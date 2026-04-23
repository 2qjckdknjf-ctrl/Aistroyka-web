# Wave 0 — Auth / tenant / role matrix (G3)

**Date:** 2026-03-26 (UTC)  
**Method:** Repo inspection only — **no** auth core changes.

---

## 1. Database / context roles (API)

**Source:** `apps/web/lib/tenant/tenant.types.ts` — `TenantRoleDb`: **`owner` | `admin` | `member` | `viewer`**.

**Resolution:** `apps/web/lib/tenant/tenant.context.ts` — tenant from `tenant_members` and/or **owner** via `tenants.user_id === auth.uid()`.

---

## 2. Web surfaces × role

| Role (tenant) | How enforced | Typical surfaces |
|----------------|--------------|------------------|
| **Admin** (product sense) | `requireAdmin` → `tenant_members.role` in **`owner` \| `admin`** | `app/[locale]/(dashboard)/admin/**` — `admin/layout.tsx` redirects non-admin to dashboard |
| **Manager** (product sense) | Same tenant users; **no** separate DB role named “manager” — **operational** users are **owner/admin/member** with dashboard access | `(dashboard)/dashboard/**`, tasks, reports, workers, projects |
| **Client / Owner portal** | **Authenticated** user with tenant; **owner**-specific API query params e.g. `OwnerViewClient` → `attention?viewer=owner` | `dashboard/projects/[id]/owner`, `projects/[id]`, portfolio, billing as applicable |
| **Viewer** | `viewer` role in `tenant_members` | Dashboard access; team page can invite `viewer` — `TeamPageClient.tsx` |

**Middleware:** `apps/web/middleware.ts` — unauthenticated users blocked from `PROTECTED_PREFIXES`: `/dashboard`, `/projects`, `/billing`, `/admin`, `/portfolio`. **Does not** distinguish roles — **layout** and **API** enforce fine-grained access.

**Dashboard layout:** `apps/web/app/[locale]/(dashboard)/layout.tsx` — any logged-in user gets `DashboardShell`; **Admin** nav gated by `requireAdmin` → `isAdmin`.

---

## 3. Mobile “Worker” / “Manager” (not DB roles)

| App | `x-client` (evidence) | API access pattern |
|-----|----------------------|---------------------|
| iOS Worker | `ios_lite` in `APIClient` / app bootstrap | **Lite allow list** — `apps/web/lib/api/lite-allow-list.ts` |
| iOS Manager | `ios_manager` — `ManagerRootView.swift` | **Not** a lite client — full `/api/v1` per server routes + tenant |
| Android | `android_lite` / `android_manager` via `AppRuntime` (shared module) | Same split |

**Lite allow list:** Only **`ios_lite`** and **`android_lite`** are restricted to **prefixes** in `lite-allow-list.ts`: `GET /api/v1/projects`, `config`, `worker`, `sync`, `media/upload-sessions`, `devices`, `auth`, analysis-status regex. **All other** `/api/v1` paths → **403** `lite_client_path_forbidden`.

---

## 4. Tenant isolation (enforcement points)

| Layer | Mechanism |
|-------|-----------|
| **API** | `getTenantContextFromRequest` + `requireTenant`; Supabase RLS + `tenant_id` filters in domain services |
| **Middleware** | Lite client path guard for `/api/v1` only |
| **Web** | Server components use `createClient()` cookie session; **mobile** uses Bearer on same routes via `createClientFromRequest` in API handlers (per-route — **known historical risk** if handler uses wrong client) |

---

## 5. Inconsistencies / risks (not redesigned here)

| Finding | Severity | Notes |
|---------|----------|--------|
| `GET /api/v1/worker` | **Stub** | `apps/web/app/api/v1/worker/route.ts` returns **501** — not used for lite contour; actual work uses `/worker/report/*`, etc. |
| **Worker summary** route | **Verify** | `workers/[userId]/summary/route.ts` uses `createClient()` — Bearer mobile may differ; **Wave 1** verify before “earnings light” on mobile |
| **Admin vs Manager** | **Naming** | “Manager” in R1 is a **product** role; DB uses **member/admin/owner** |

---

## 6. Web Client / Owner foundation

**Exists:** `OwnerViewClient`, owner route `dashboard/projects/[id]/owner/page.tsx`, attention API with `viewer=owner`.  
**Verdict:** **IN R1 — ACCEPTABLE FOUNDATION** for a **narrow** owner portal — **COMPLETE BEFORE LAUNCH** for R1 decision/decision UX items per product.

---

## 7. Blockers before Wave 1 (product implementation)

| Blocker | Type |
|---------|------|
| None for **documenting** matrix | — |
| **Implementation** must not break lite allow list or tenant guards | Process |

**G3 status:** **PASS** for **explicit matrix**; **PARTIAL** for **runtime proof** (requires staged tests — not executed in Wave 0).
