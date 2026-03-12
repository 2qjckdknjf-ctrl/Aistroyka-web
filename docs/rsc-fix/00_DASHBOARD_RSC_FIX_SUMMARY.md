# Dashboard RSC fix summary

## Problem

Production dashboard crashed on GET /ru/dashboard (and /en/dashboard) with:

```
Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
{t: function ..., tProjects: ..., locale: ...}
```

Translation functions from the server were being passed into Client Components, which is invalid in Next.js RSC.

## Root cause

- **dashboard/page.tsx** (Server Component) passed `t`, `tProjects`, and `locale` to **DashboardRecentProjectsClient** (Client Component). `t` and `tProjects` are functions returned by `getTranslations()` and are not serializable.
- **projects/page.tsx** passed `t` and `locale` to **ProjectsListClient** (Client Component). Same issue for `t`.

## Fix applied

- **Client components that need translations** now use next-intl’s **client hooks** (`useTranslations`, `useLocale`) instead of receiving translation functions or locale as props.
- **Server components** no longer pass `t`, `tProjects`, or `locale` to these client components; they only pass serializable props (e.g. `canCreate`, `createForm`).

## Files changed

| File | Change |
|------|--------|
| `app/[locale]/(dashboard)/dashboard/page.tsx` | `<DashboardRecentProjectsClient />` with no props. |
| `app/[locale]/(dashboard)/dashboard/DashboardRecentProjectsClient.tsx` | Use `useTranslations("dashboard")`, `useTranslations("projects")`, `useLocale()`; remove props `t`, `tProjects`, `locale`. |
| `app/[locale]/(dashboard)/projects/page.tsx` | Remove `t` and `locale` from `<ProjectsListClient />`; drop unused `getLocale` import. |
| `app/[locale]/(dashboard)/projects/ProjectsListClient.tsx` | Use `useTranslations("projects")`, `useLocale()`; remove props `t`, `locale`. |

## Verification

- Build: run `bun run cf:build` or `next build` from apps/web; should succeed.
- Manual: open /ru/dashboard and /en/dashboard after login; page should render without the "Functions cannot be passed directly to Client Components" error.
- i18n: same copy as before; only the source of translations moved from server props to client hooks.

## Other risks checked

- No other app routes pass translation functions into Client Components. DashboardShell, Nav, and AiActionPanel use hooks or only serializable props (e.g. `locale` as string).
