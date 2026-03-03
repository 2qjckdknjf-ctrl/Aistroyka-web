# Domain → Worker verification (aistroyka.ai)

How to confirm aistroyka.ai serves the **aistroyka-web-production** Worker and how to verify the build.

---

## DNS (Cloudflare)

- **Zone:** aistroyka.ai must be added to the same Cloudflare account that owns the Worker.
- **Records to check:**  
  - **@** (apex): A/AAAA record, **Proxied** (orange cloud).  
  - **www**: CNAME to apex or to the Workers custom hostname, **Proxied**.
- **Vercel:** If the domain was previously on Vercel, remove it from Vercel DNS (or the project) so Cloudflare is the only DNS. Conflicting CNAME/apex can send traffic to the wrong place.

---

## Workers routes (manual)

CI does **not** manage routes (no zone permission on the token). Set them once in the Dashboard:

1. **Workers & Pages** → **Workers** → **aistroyka-web-production**.
2. **Triggers** → **Routes** → **Add route**:
   - `aistroyka.ai/*` → Zone: **aistroyka.ai**
   - `www.aistroyka.ai/*` → Zone: **aistroyka.ai**

See **docs/ROUTES_MANUAL_SETUP.md** for step-by-step.

---

## Verify with curl

1. **Worker directly (workers.dev):**  
   Replace `<account>` with your Workers subdomain (from deploy step output).
   ```bash
   curl -sI "https://aistroyka-web-production.<account>.workers.dev/en/dashboard"
   ```
   Expect 302 to login if unauthenticated; 200 if session is valid.

2. **Domain:**
   ```bash
   curl -sI "https://aistroyka.ai/en/dashboard"
   ```
   Same expectations. If you get a different host (e.g. Vercel) or 5xx, DNS or routes are wrong.

3. **Build marker (HTML):**  
   To see the `Build: <sha7> / <date>` footer you must request a page that renders the dashboard layout (e.g. `/en/dashboard`) with a valid session. Unauthenticated requests get redirect or login page (no build marker).
   ```bash
   ./scripts/prod-verify.sh "https://aistroyka-web-production.<account>.workers.dev"
   ```
   Compare the "Build marker" lines for domain vs workers.dev; they should match the commit deployed by CI.

---

## Verify in the browser

1. Open **https://aistroyka.ai** (or **https://www.aistroyka.ai**).  
2. Log in and go to **Dashboard** (e.g. **/en/dashboard**).  
3. Scroll to the bottom: you should see **Build: \<sha7\> / \<date\>**.  
4. In GitHub Actions, open the latest **Deploy Cloudflare (Production)** run and note the commit SHA (first 7 chars).  
5. They should match; if not, see **docs/PROD_BUILD_TRUTH_REPORT.md**.
