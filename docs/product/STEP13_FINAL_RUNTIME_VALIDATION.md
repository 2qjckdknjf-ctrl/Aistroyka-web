# Step 13 Final Runtime Validation

**Date:** 2025-03-14

---

## Summary

| Area | Evidence | Live Proven |
|------|----------|-------------|
| Schema | project_cost_items exists, queryable, columns correct | YES |
| DB insert | MCP insert succeeded; item persisted | YES |
| Unit tests | cost.service 9 tests, cost.repository 8 tests — all pass | YES |
| API route wiring | GET returns 401 without auth (correct) | YES |
| API with auth | GET/POST/PATCH not run — no credentials | NO |
| Costs tab load | Redirect to login confirmed; tab not loaded with data | NO |
| Create via UI | Code path exists; not executed | NO |
| Update via API | Code path exists; not executed | NO |
| Manager flow | Code complete; not executed with session | NO |

---

## Verification Script

**Path:** `apps/web/scripts/verify-cost-runtime.mjs`

**Usage:**
```bash
cd apps/web
BASE_URL=http://localhost:3000 \
STEP13_VERIFY_EMAIL=<tenant-member-email> \
STEP13_VERIFY_PASSWORD=<password> \
node scripts/verify-cost-runtime.mjs
```

**Requires:** NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (from .env or env).

**Proves:** GET costs, POST create, PATCH update, GET summary refresh — all under Bearer token auth.

---

## Blocker

**No auth access:** Automation cannot obtain a valid session. Operator must run verify-cost-runtime.mjs with real tenant member credentials, or manually login and verify costs tab + create flow in browser.
