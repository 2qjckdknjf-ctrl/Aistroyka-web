# Cloudflare domain fix evidence

**Goal:** Domain aistroyka.ai and www.aistroyka.ai serve **only** the worker **aistroyka-web-production** (apps/web). No routes to other workers (dev/staging/deleted).

---

## Routes (no secrets)

Run in Cloudflare Dashboard or via API and paste evidence below.

**Workers & Pages → aistroyka-web-production → Triggers → Routes**

| Route | Zone | Worker |
|-------|------|--------|
| `aistroyka.ai/*` | aistroyka.ai | aistroyka-web-production |
| `www.aistroyka.ai/*` | aistroyka.ai | aistroyka-web-production |

**Removed:** Any route for aistroyka.ai or www.aistroyka.ai that pointed to another worker (dev, staging, or deleted). List removed route patterns here: _______________

---

## DNS proxy state

**Websites → aistroyka.ai → DNS → Records**

| Type | Name | Content | Proxy |
|------|------|---------|--------|
| A or AAAA | @ | (your target) | **Proxied** (orange cloud) |
| CNAME | www | aistroyka.ai (or correct target) | **Proxied** (orange cloud) |

Confirmation: @ and www are **Proxied**. Yes / No: _______________

---

## Production worker env vars (names only)

Set in **Workers & Pages → aistroyka-web-production → Settings → Variables and Secrets**.

**Required (present):**

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

**Optional:** AI_ANALYSIS_URL, OPENAI_API_KEY (names only; values not stored in repo).

---

## Verification

- `curl -sI https://aistroyka.ai/en/dashboard` → 200 or 302 (not 5xx).
- Browser: https://aistroyka.ai → redirects to locale/dashboard or login; footer shows **Build: \<sha7\> / \<time\>** after login.
