# Middleware Matcher Review

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Current Middleware State

Current `apps/web/middleware.ts` handles:

- lite/worker client allow-list for `/api/v1/*`
- owner API/page gating
- dashboard root redirect to `/en/dashboard`
- Supabase session refresh
- locale routing via `next-intl`
- protected page redirect to login
- post-auth redirect resolution
- page security headers
- protected/auth page cache-control

Current matcher:

```ts
export const config = {
  matcher: [
    "/((?!api|_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/api/v1/:path*",
  ],
};
```

## Public / Private Route Assumptions

Protected page prefixes include:

- `/dashboard`
- `/portal`
- `/projects`
- `/billing`
- `/admin`
- `/portfolio`
- `/subscribe`

Auth pages include:

- `/login`
- `/register`

Owner pages and owner APIs have a separate platform-owner gate.

## API Route Assumptions

Middleware only surface-gates `/api/v1/*` for lite clients and owner API routes. General API authorization remains route-owned.

This is important: middleware must not be treated as the only auth layer for API routes.

## Branch Differences

`hotfix/middleware-matcher-and-headers` changes matcher/header behavior and documents OpenNext API-header limitations. It also narrows matcher exclusion to all `_next/` internals and experiments with API header handling.

`feat/p0-deps-and-security-headers` introduces page/API header profile helpers and applies them from middleware, but it also includes package/lockfile and broader project churn.

## Unsafe Matcher Risks

Matcher changes can break:

- RSC/data requests
- Next internals
- image/static assets
- API route execution
- Supabase auth cookie propagation
- localized route redirects
- owner page/API gate ordering
- lite client allow-list enforcement

## Required Tests for Future Matcher Changes

Before any matcher/middleware PR:

- unauthenticated dashboard redirects to localized login with `next`
- authenticated login redirects to expected dashboard entry
- public pages still render
- `/api/v1/*` route handlers still execute
- lite client forbidden path returns 403
- owner API/page gates still run
- Supabase auth cookies are preserved
- `_next/*` assets/data are not intercepted incorrectly
- Cloudflare/OpenNext build passes

## Matcher Verdict

Middleware matcher changes safe now: PARTIAL.

Safe only as a tiny focused PR with route/middleware tests and Cloudflare build verification. Broad merge is not safe.
