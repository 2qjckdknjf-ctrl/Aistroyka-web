# Deploy verification

How to confirm the latest deploy is live and where to manage routes.

---

## 1. Verify latest version

### Workers.dev (staging / production Worker URL)

- After a deploy, the **Deploy to Cloudflare** step in GitHub Actions prints the Worker URL (e.g. `https://aistroyka-web-production.<account>.workers.dev` or staging equivalent).
- Open that URL in a browser to confirm the build is serving.
- **Post-deploy summary** step in CI prints: deployed worker name, commit SHA; workers.dev URL is in the deploy step log above it.

### Production domain (aistroyka.ai)

- **https://aistroyka.ai** and **https://www.aistroyka.ai** serve the Worker only after routes are added in the Cloudflare Dashboard (see below).
- Hard refresh to avoid cache: **Cmd+Shift+R** (macOS) or **Ctrl+Shift+R** (Windows/Linux).

---

## 2. Where to add routes (manual, Cloudflare UI)

Routes are **not** set by CI (no zone route permissions on the token). Add them once in the Dashboard:

1. **Cloudflare Dashboard** → **Workers & Pages** → **Workers**.
2. Open **aistroyka-web-production**.
3. **Triggers** → **Routes** → **Add route**:
   - `aistroyka.ai/*` → Zone: **aistroyka.ai**
   - `www.aistroyka.ai/*` → Zone: **aistroyka.ai**

See **docs/ROUTES_MANUAL_SETUP.md** for the exact steps.

---

## 3. What to check after a deploy

| Where | What to check |
|-------|----------------|
| **GitHub Actions** | Workflow **Deploy Cloudflare (Production)** (or Staging) — all steps green; **Post-deploy summary** shows worker name and commit SHA. |
| **Cloudflare Dashboard** | **Workers & Pages** → **aistroyka-web-production** (or staging) → **Deployments** — latest deployment is **Active** and matches the commit time. |
| **Browser** | workers.dev URL and, if routes are set, https://aistroyka.ai and https://www.aistroyka.ai — hard refresh and confirm the app loads. |

---

## 4. Hard refresh

- **macOS:** Cmd+Shift+R  
- **Windows/Linux:** Ctrl+Shift+R  

Use a private/incognito window if the cache is stubborn.
