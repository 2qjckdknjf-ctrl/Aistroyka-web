# Domain and routing verification (aistroyka.ai)

How to confirm requests hit the Cloudflare Worker and that DNS/routes are correct. No secrets.

---

## 1. Check routes exist (Cloudflare Worker triggers)

1. **Cloudflare Dashboard** → **Workers & Pages** → **Workers** → **aistroyka-web-production**.
2. Open **Triggers** → **Routes**.
3. Confirm at least:
   - `aistroyka.ai/*` → Zone: aistroyka.ai  
   - `www.aistroyka.ai/*` → Zone: aistroyka.ai  

If missing, add them (see **docs/ROUTES_MANUAL_SETUP.md**).

---

## 2. Verify DNS is in Cloudflare (nameservers)

1. At your domain registrar, ensure **aistroyka.ai** uses the **nameservers** shown in Cloudflare for that zone (e.g. `xxx.ns.cloudflare.com`, `yyy.ns.cloudflare.com`).
2. Check propagation:
   ```bash
   dig NS aistroyka.ai +short
   ```
   You should see Cloudflare NS records.
3. Zone must be **Active** in Cloudflare (not “Pending nameservers”).

---

## 3. Verify requests hit the Worker

Call these from a browser or `curl`; they are served by the Worker when routing is correct.

### Health (no auth)

```bash
curl -s https://aistroyka.ai/api/health
```

Expected JSON includes `ok: true`, `requestHost` (e.g. `aistroyka.ai`), and `appUrl` if set.

### Auth diag (config check, no secrets)

```bash
curl -s https://aistroyka.ai/api/auth/diag
```

Expected: `anonKeyPresent: true`, `supabaseUrlHost` set, `appUrl`: `https://aistroyka.ai`, `requestHost`: `aistroyka.ai` (or `www.aistroyka.ai` when called with that host).

If you get a different host (e.g. workers.dev) or 404, routes or DNS are not pointing at the Worker.

---

## 4. Hard refresh and cache

- **Browser:** Cmd+Shift+R (macOS) or Ctrl+Shift+R (Windows/Linux).  
- If the app or login still looks stale, try a private/incognito window or clear site data for aistroyka.ai.

---

## 5. Quick checklist

- [ ] Cloudflare Worker **aistroyka-web-production** has routes for `aistroyka.ai/*` and `www.aistroyka.ai/*`.
- [ ] Zone **aistroyka.ai** is on the same Cloudflare account and nameservers are set at the registrar.
- [ ] `curl -s https://aistroyka.ai/api/health` returns `ok: true` and `requestHost`.
- [ ] `curl -s https://aistroyka.ai/api/auth/diag` shows expected `appUrl` and `anonKeyPresent: true`.
- [ ] Browser hard refresh when testing login/redirects.
