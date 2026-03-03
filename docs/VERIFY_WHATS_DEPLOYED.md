# How to verify what is deployed (production / staging)

## Build stamp (UI)

After deploy, the **dashboard** (and any page using the main app layout) shows a small **build stamp** in the top-right of the nav, e.g.:

- `build: a1b2c3d · 2026-03-03 16:20`

- **First part** = first 7 characters of the Git commit SHA that was built.
- **Second part** = build timestamp (UTC) from CI.

Compare the stamp on the live site with the commit SHA and workflow run time in GitHub Actions to confirm the deployed UI is from the expected build.

## Where to check

- **Production**: Your production domain (e.g. aistroyka.ai), or the workers.dev URL for the production worker if enabled (see deploy step output in Actions).
- **Staging**: Staging URL or the workers.dev URL for the staging worker (deploy runs on push to `develop`).

## If UI changes are not visible

1. **Hard refresh** to bypass browser cache:
   - **macOS**: `Cmd + Shift + R` (Chrome/Edge/Firefox) or `Cmd + Option + R` (Safari).
   - **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`.

2. **Cache-bust the URL** (if needed): open the dashboard with a query param, e.g.  
   `https://your-domain/en/dashboard?v=a1b2c3d`  
   using the first 7 chars of the commit SHA you expect. This can help force the browser to treat the page as new.

3. **Confirm in GitHub Actions**:
   - Open the latest "Deploy Cloudflare (Production)" (or Staging) run.
   - Note the commit SHA and the "Set build stamp env" / "Build" step times.
   - Compare with the build stamp on the live site.

4. **Incognito/private window**: Open the site in a private window to avoid cached assets.

## Routes

Routes are managed manually in the Cloudflare Dashboard. CI does not create or update routes (see `apps/web/wrangler.toml`: route blocks are commented out).
