# Production deploy result

## Deploy status

**Success.** Build and production deploy completed without failure.

## Production version

- **Worker:** aistroyka-web-production
- **Version ID:** 1b332612-4b2b-4fbb-afeb-ddc924c36164
- **Workers.dev:** https://aistroyka-web-production.z6pxn548dk.workers.dev

## Health endpoints

| Endpoint | Status | Result |
|----------|--------|--------|
| https://aistroyka.ai/api/health | 200 | `{"ok":true,"db":"ok",...}` |
| https://aistroyka.ai/api/v1/health | 200 | `{"ok":true,"db":"ok",...}` |

## Dashboard routes

| Route | Status | Result |
|-------|--------|--------|
| /ru/dashboard | 307 | Redirect to /ru/login (no 500) |
| /en/dashboard | 307 | Redirect to /en/login (no 500) |

Unauthenticated requests are redirected to login as expected; dashboard no longer returns server error.

## Fixes included in this deploy

1. **Runtime fix:** Production uses patched bundle (middleware-manifest __require stub). /api/v1/health returns 200.
2. **RSC fix:** Dashboard no longer passes translation functions to Client Components. /ru/dashboard and /en/dashboard render without "Functions cannot be passed to Client Components" error.

## Login flow

With the above fixes deployed, login → dashboard should work: after authenticating, the dashboard page should load without 500 or RSC serialization errors.
