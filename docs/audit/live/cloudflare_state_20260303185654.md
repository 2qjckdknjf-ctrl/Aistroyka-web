# Cloudflare production state

**Timestamp:** 20260303185654  
**Account:** 864f04d729c24f574a228558b40d7b82 (Z6pxn548dk@privaterelay.appleid.com's Account)

---

## Worker verified

| Field | Value |
|-------|--------|
| **Worker name** | aistroyka-web-production |
| **Worker id** | 7efae5acb9e64817a7f1753c1dc5a17a |
| **Modified** | 2026-03-03T17:30:53Z |
| **Created** | 2026-02-23T23:05:52Z |

---

## Required checks (verify in Dashboard)

The Cloudflare MCP (builds) does not expose routes, env vars, or secrets. Confirm in Cloudflare Dashboard:

1. **Routes:** aistroyka.ai/* and www.aistroyka.ai/* map only to **aistroyka-web-production** (no legacy workers on same routes).
2. **Environment variables (production):**
   - NEXT_PUBLIC_SUPABASE_URL — set
   - NEXT_PUBLIC_SUPABASE_ANON_KEY — set
   - **SUPABASE_SERVICE_ROLE_KEY** — must exist (required for job processing after hardening)
3. **SUPABASE_SERVICE_ROLE_KEY** — configured as **Secret** (not plain variable).
4. **Cache:** HTML/dashboard routes not aggressively cached (Cache-Control: private or no-store for auth pages; middleware already sets this).

---

## Summary

- **Worker exists and is active.** Env and secrets must be verified in Cloudflare Dashboard → Workers & Pages → aistroyka-web-production → Settings → Variables and Secrets.
