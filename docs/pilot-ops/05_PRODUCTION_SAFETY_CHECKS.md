# Phase 5 — Production Safety Checks

**Goal:** Ensure no dangerous debug surfaces are exposed in production.

---

## Production rules

- **DEBUG_AUTH:** Must be unset or not `true` in production. When false/unset and NODE_ENV=production, `isDebugAuthAllowed` is false unless host is in ALLOW_DEBUG_HOSTS.
- **ENABLE_DIAG_ROUTES:** Must be unset or not `true` in production. When false/unset, diag routes return 404 in production.
- **ALLOW_DEBUG_HOSTS:** In production, if DEBUG_AUTH or ENABLE_DIAG_ROUTES is true, only requests whose Host is in this list get debug/diag. For pilot, leave debug flags false and ALLOW_DEBUG_HOSTS unset so all debug/diag are off.

---

## Operator verification steps

**1. Debug auth returns 404**

```bash
curl -s -o /dev/null -w "%{http_code}" https://aistroyka.ai/api/_debug/auth
```

**Expected:** `404`. If 200, debug is enabled in production — remove or set DEBUG_AUTH=false and ENABLE_DIAG_ROUTES=false, and ensure ALLOW_DEBUG_HOSTS is not open to the world.

**2. Diag Supabase returns 404**

```bash
curl -s -o /dev/null -w "%{http_code}" https://aistroyka.ai/api/diag/supabase
```

**Expected:** `404`. If 200, diag is enabled — set ENABLE_DIAG_ROUTES=false and redeploy.

---

## Copy-paste checks (replace host)

```bash
# Replace BASE with your production URL, e.g. https://aistroyka.ai
BASE=https://aistroyka.ai

# Expect 404
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/api/_debug/auth"
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/api/diag/supabase"
```

Both lines should output `404`.

---

## If checks fail

- In Cloudflare Worker **Variables**, ensure for **Production**:
  - `DEBUG_AUTH` is not set or is empty or `false`.
  - `DEBUG_DIAG` is not set or is empty or `false`.
  - `ENABLE_DIAG_ROUTES` is not set or is empty or `false`.
- Redeploy the Worker and run the curl checks again.
