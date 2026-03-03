# Build marker — verify domain is serving the latest deployment

The dashboard layout shows a small footer line:

**Build: \<sha7\> / \<date\>**

- **\<sha7\>** = first 7 characters of the Git commit that was built, or `local` when running locally.
- **\<date\>** = build timestamp (when set in CI) or `—` when not available.

## How it’s set

- **SHA:** `VERCEL_GIT_COMMIT_SHA` (Vercel) → else `GITHUB_SHA` (GitHub Actions) → else `local`.
- **Date:** `NEXT_PUBLIC_BUILD_TIME` when set in CI (e.g. in our Cloudflare deploy workflow).

## How to verify the domain is serving the latest deployment

1. **Deploy**  
   Push to the branch that triggers your production deploy (e.g. `main`). Wait for the workflow to finish.

2. **Note the commit**  
   In GitHub Actions, open the latest “Deploy Cloudflare (Production)” run and note the **commit SHA** (e.g. `abc1234`). Optionally note the **Set build stamp env** or build step time.

3. **Open the live site**  
   Go to your production URL (e.g. `https://aistroyka.ai`), sign in if needed, and open the **dashboard** (e.g. `https://aistroyka.ai/en/dashboard`).

4. **Check the footer**  
   Scroll to the bottom of the page. The footer line should show:
   - **Build: \<same 7 chars as commit\> / \<date\>**  
   If it matches the commit from step 2, the domain is serving that deployment.

5. **If it doesn’t match**  
   - Hard refresh (Cmd+Shift+R / Ctrl+Shift+R) or try an incognito window.  
   - Confirm in Cloudflare that the domain routes point to the correct worker (e.g. **aistroyka-web-production**).  
   - If you use a CDN or cache in front, purge cache for the dashboard path and retry.

The build marker is non-intrusive (small caption-style text) and is only for verification; it does not affect app behavior.
