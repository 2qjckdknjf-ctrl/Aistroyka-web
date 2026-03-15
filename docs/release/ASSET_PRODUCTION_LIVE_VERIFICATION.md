# Production static asset — live verification

**Date:** 2025-03-15  
**Goal:** Verify live URLs return 200 after fix (fresh deploy).

## Pre-fix state (at audit time)

| URL | Status |
|-----|--------|
| https://aistroyka.ai/ | 307 (redirect to locale) |
| https://aistroyka.ai/brand/aistroyka-logo.png | 404 |
| https://aistroyka.ai/brand/aistroyka-icon.png | 404 |
| https://aistroyka.ai/favicon.ico | 404 |

Homepage content was updated (new design); asset URLs were 404.

## Required verification (after redeploy)

Run after "Deploy Cloudflare (Production)" has completed successfully from current main:

```bash
curl -sS -o /dev/null -w "%{http_code}" https://aistroyka.ai/
curl -sS -o /dev/null -w "%{http_code}" https://aistroyka.ai/brand/aistroyka-logo.png
curl -sS -o /dev/null -w "%{http_code}" https://aistroyka.ai/brand/aistroyka-icon.png
curl -sS -o /dev/null -w "%{http_code}" https://aistroyka.ai/favicon.ico
```

**Pass criteria:**

1. https://aistroyka.ai/ → 200 or 307 (redirect to /en or similar is OK; follow redirect and confirm 200 for the final page).
2. https://aistroyka.ai/brand/aistroyka-logo.png → 200
3. https://aistroyka.ai/brand/aistroyka-icon.png → 200
4. https://aistroyka.ai/favicon.ico → 200

Also confirm the homepage still shows the new design and the header logo is visible (if the UI displays it).

## Results (fill after redeploy)

First re-check ~6 min after push c9bed9e9: logo/icon/favicon still 404. Confirm workflow success in Actions, then re-run curl checks.

| Check | Result |
|-------|--------|
| Homepage 200 (or 307→200) | 307 (OK) |
| Logo 200 | 404 at re-check |
| Icon 200 | 404 at re-check |
| Favicon 200 | 404 at re-check |
| New design visible | Yes |

**Brand assets live:** NO (re-verify after confirmed successful deploy).
