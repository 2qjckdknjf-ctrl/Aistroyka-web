# Domain and routing verification (aistroyka.ai)

How to confirm requests hit the Cloudflare Worker and that DNS/routes are correct.

---

## 1. Check routes in Cloudflare (Worker triggers)

1. **Cloudflare Dashboard** → **Workers & Pages** → **Workers** → **aistroyka-web-production**.
2. Open **Triggers** → **Routes**.
3. Confirm at least:
   - `aistroyka.ai/*` → Zone: aistroyka.ai  
   - `www.aistroyka.ai/*` → Zone: aistroyka.ai  

If missing, add them (see **docs/ROUTES_MANUAL_SETUP.md**).

---

## 2. Check DNS and nameservers

1. Zone **aistroyka.ai** must be on the same Cloudflare account as the Worker.
2. At your registrar, **nameservers** for aistroyka.ai must be the ones shown in Cloudflare (e.g. `xxx.ns.cloudflare.com`, `yyy.ns.cloudflare.com`).
3. In Cloudflare → **Websites** → **aistroyka.ai** → **DNS**: ensure A/AAAA or CNAME for `@` and `www` are **Proxied** (orange cloud) so traffic hits Cloudflare and then the Worker.

---

## 3. Verify by loading endpoints

From a terminal or browser:

- **Health:**  
  `curl -sI https://aistroyka.ai/api/health`  
  Expect **200** and JSON body with `"ok": true`, `requestHost`, `appUrl`.

- **Auth diag:**  
  `curl -s https://aistroyka.ai/api/auth/diag`  
  Expect JSON with `anonKeyPresent`, `supabaseUrlHost`, `appUrl`, `requestHost` (no secrets).

If you get 5xx or “worker not found”, routes or DNS are wrong. If 200 but `requestHost` is unexpected, host header / routing may be off.

---

## 4. Hard refresh and cache

- **Browser:** Cmd+Shift+R (macOS) or Ctrl+Shift+R (Windows/Linux).  
- Use a private/incognito window if the cache is stubborn.  
- For API checks, `curl` does not use browser cache.
