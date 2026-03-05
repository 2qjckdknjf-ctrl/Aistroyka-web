# Dashboard deploy diagnosis — why production UI did not change

---

## 1. Exact file used for /dashboard

**Route path:** `/dashboard`  
**File that renders it:** **`app/(dashboard)/dashboard/page.tsx`** (at **repo root**)

The production Worker is built from the **repo root**. Next.js App Router resolves `/dashboard` from the root `app/` directory. The route group `(dashboard)` does not affect the URL, so:

- **`app/(dashboard)/dashboard/page.tsx`** → **`/dashboard`**

There is no `pages/dashboard` (no `pages/` directory). There is no `app/dashboard/page.tsx` at root; only `app/(dashboard)/dashboard/page.tsx`.

---

## 2. Multiple dashboard routes / layouts

| Location | Path on disk | URL | Built by CI? |
|----------|----------------|-----|--------------|
| **Repo root** | `app/(dashboard)/dashboard/page.tsx` | `/dashboard` | **Yes** (root is `working-directory`) |
| **apps/web** | `apps/web/app/[locale]/(dashboard)/dashboard/page.tsx` | `/[locale]/dashboard` (e.g. `/en/dashboard`) | **No** |

- **Root app:** `app/(dashboard)/layout.tsx` wraps `app/(dashboard)/dashboard/page.tsx`. No layout is overriding the dashboard; the layout only adds `<Nav>` and a wrapper.
- **apps/web:** Separate Next.js app under `apps/web/` with its own `app/`, i18n (`[locale]`), and redesigned dashboard. **CI does not build `apps/web`** because the workflow runs from repo root and there is no `working-directory: apps/web`. The root `package.json` has `next` and `cf:build`; `npm run cf:build` at root builds only the root `app/` tree.

---

## 3. Redesign vs. what’s committed and deployed

**Last commit that modified the dashboard file that production uses:**

- **File:** `app/(dashboard)/dashboard/page.tsx` (root)  
- **Commit:** **`72d39e0`** — “Initial commit for Cloudflare deployment”

So the **only** version of the root dashboard that has ever been committed is the original one. No “redesign” commit has changed this file.

The **redesigned** dashboard (Card, `DashboardAIInsightsClient`, `DashboardRecentProjectsClient`, aistroyka design tokens, i18n) exists only in:

- **`apps/web/app/[locale]/(dashboard)/dashboard/page.tsx`**

That file (and the rest of `apps/web`) is **not** part of the root build, so no commit that only touches `apps/web` can change what is deployed for `/dashboard`.

---

## 4. Build and “latest commit”

- **cf:build** runs at **repo root** (`npm run cf:build` in the workflow with no `working-directory`).
- The build **does** use the latest commit (checkout is the first step after “Check required secrets”).
- So the build **does** include the latest version of **root** files, including **`app/(dashboard)/dashboard/page.tsx`**.
- The build does **not** include **apps/web**. So “latest commit” only affects the root app; it does not pull in the apps/web redesign.

---

## 5. Layout override

- **`app/(dashboard)/layout.tsx`** (root) wraps all `(dashboard)` routes (including `/dashboard`). It:
  - Ensures the user is logged in (redirect to `/login` if not).
  - Renders `<Nav>` and a wrapper div.
- It does **not** override or replace the dashboard page content. The dashboard content is exactly what’s in **`app/(dashboard)/dashboard/page.tsx`**.

---

## Summary: why the UI is unchanged

| Question | Answer |
|----------|--------|
| **Exact file used for /dashboard** | **`app/(dashboard)/dashboard/page.tsx`** (repo root). |
| **Is the redesign in that file?** | **No.** That file is the original simple dashboard (table, “Recent projects”, no Card, no AI insights). The redesign is only in **`apps/web/app/[locale]/(dashboard)/dashboard/page.tsx`**. |
| **Commit that last changed the deployed dashboard** | **`72d39e0`** (Initial commit for Cloudflare deployment). No later commit changed the root dashboard. |
| **Reason production UI did not change** | Production builds and deploys the **root** Next.js app only. The **redesigned** dashboard lives in **apps/web**, which is **not** built by CI. So the Worker always serves the root app and the old **`app/(dashboard)/dashboard/page.tsx`**; the new UI in apps/web is never included in the build. |

---

## What to do next (options)

1. **Build and deploy the apps/web app instead of the root app**  
   - In the deploy workflow, set `working-directory: apps/web` (and ensure `package.json`, `next.config`, and `wrangler.toml` there are used).  
   - Then `/dashboard` would be under a locale (e.g. `/en/dashboard`); you may need i18n/default locale and possibly redirects (e.g. `/dashboard` → `/en/dashboard`) depending on how apps/web is set up.

2. **Bring the redesign into the root app**  
   - Copy or refactor the redesigned dashboard (and any shared components) from **apps/web** into **app/(dashboard)/dashboard/** at repo root so the root build serves the new UI at `/dashboard`.

3. **Confirm product intent**  
   - Decide whether production is the root app or the apps/web app, then align the CI build (and optionally redirects/routing) with that choice.
