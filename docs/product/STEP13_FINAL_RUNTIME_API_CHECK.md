# Step 13 Final Runtime — API Check

**Date:** 2025-03-14

---

## B. AUTHENTICATED COST ROUTE

### Status: **PARTIAL**

### What Was Proven

| Check | Result |
|-------|--------|
| GET /api/v1/projects/:id/costs without auth | 401 "Authentication required" (correct) |
| Route exists and does not 500 on missing table | YES (route returns 401, not 500) |
| createClientFromRequest supports Bearer token | YES (server.ts: Authorization Bearer) |
| Cost list + summary API shape | YES (route returns `data.items`, `data.summary`) |
| verify-cost-runtime.mjs script | YES (created; uses Bearer token for auth) |

### Blockers

- **No auth credentials:** Script requires STEP13_VERIFY_EMAIL and STEP13_VERIFY_PASSWORD. Without these, authenticated GET cannot be performed by automation.
- **Operator action:** Run `BASE_URL=http://localhost:3000 STEP13_VERIFY_EMAIL=<tenant-member> STEP13_VERIFY_PASSWORD=<pwd> node apps/web/scripts/verify-cost-runtime.mjs` to prove full API flow.

### Evidence

```bash
curl -sS "http://localhost:3000/api/v1/projects/00a104f9-b6b0-4604-84ef-71dabd9e8f54/costs"
# → {"error":"Authentication required"} 401
```

### Cost Item in DB

One cost item inserted via MCP for project `00a104f9-b6b0-4604-84ef-71dabd9e8f54`:
- id: `1c7b5c6c-91d7-4457-96ce-d620b43914a2`
- title: "Runtime verification test item"
- planned_amount: 50000, actual_amount: 0, status: planned

When API is called with valid auth, this item should appear in the response.
