# Deploy branch with brand assets (ed3e6b59)

**Goal:** Fix live brand asset mismatch by deploying the branch that contains the approved brand integration.

## 1. Current state

- **Commit with brand:** `ed3e6b59` (feat(brand): integrate approved AISTROYKA brand kit across project).
- **Branch that has it:** `ops/external-setup-attempt` (and any branch that contains that commit).
- **Production trigger:** Push to `main` runs "Deploy Cloudflare (Production)". **`main` does not contain ed3e6b59**, so production is currently serving pre-brand assets (or older build).

## 2. Deploy from branch (without merging to main)

The workflow supports **workflow_dispatch** with input **ref**:

1. Push this branch (`ops/external-setup-attempt`) so the workflow file with `ref` input is on GitHub.
2. In GitHub: **Actions** → **Deploy Cloudflare (Production)** → **Run workflow**.
3. Select **Use workflow from** branch: `ops/external-setup-attempt`.
4. Set **ref** to: `ops/external-setup-attempt`.
5. Click **Run workflow**.

The job will checkout that ref, build, and deploy to Cloudflare production. After the run, production will serve the new brand assets.

## 3. Alternative: merge to main and push

To make `main` the source of the new assets:

```bash
git checkout main
git pull origin main
git merge ops/external-setup-attempt
git push origin main
```

The push will trigger the deploy automatically.

## 4. After deploy: cache

Assets are behind **Cloudflare** (`cf-cache-status: HIT`). If URLs still return old content after deploy:

- **Option A:** Purge in Cloudflare Dashboard → Caching → Configuration → Purge by URL:  
  `https://aistroyka.ai/brand/aistroyka-logo.png`  
  `https://aistroyka.ai/brand/aistroyka-icon.png`  
  `https://aistroyka.ai/favicon.ico`  
  (and optionally `/favicon-32x32.png`, `/apple-touch-icon.png`, `/brand/social/aistroyka-og.png`.)
- **Option B:** Purge everything (Cache → Purge Everything) if you need a full refresh.
- **Browser:** Hard refresh (Cmd+Shift+R / Ctrl+Shift+R) or clear site data for aistroyka.ai.

## 5. Verify

- Direct URLs:  
  https://aistroyka.ai/brand/aistroyka-logo.png  
  https://aistroyka.ai/brand/aistroyka-icon.png  
  https://aistroyka.ai/favicon.ico  
- Check response headers for new `etag` / `last-modified` after purge.
- Check site (header wordmark, hero logo, favicon) in an incognito window after purge.
