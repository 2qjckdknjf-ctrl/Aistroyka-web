# Which file serves /dashboard (apps/web)

## Routing summary

- **URL `/dashboard`** (no locale): handled by **`apps/web/app/dashboard/page.tsx`**, which only redirects to **`/en/dashboard`** (no UI content).
- **URLs `/en/dashboard`, `/ru/dashboard`, etc.**: served by **`apps/web/app/[locale]/(dashboard)/dashboard/page.tsx`**. This is the **real** dashboard page that renders the UI (title, signed-in user, AI insights, recent projects).
- **Layout** wrapping all locale-prefixed dashboard pages: **`apps/web/app/[locale]/(dashboard)/layout.tsx`** (uses `AppLayout` + Nav).

## Exact file path (real dashboard content)

```
apps/web/app/[locale]/(dashboard)/dashboard/page.tsx
```

## Middleware

- **`apps/web/middleware.ts`** redirects `/dashboard` and `/dashboard/` to `/en/dashboard` (308).
- Locale prefix is always present (`localePrefix: "always"`); supported locales: `ru`, `en`, `es`, `it` (see `apps/web/i18n/routing.ts`).

## Candidates (for reference)

| Path | Role |
|------|------|
| `apps/web/app/dashboard/page.tsx` | Redirect only: `/dashboard` → `/en/dashboard` |
| `apps/web/app/[locale]/(dashboard)/dashboard/page.tsx` | **Actual dashboard UI** |
| `apps/web/pages/dashboard.tsx` | Does not exist (App Router only) |
