# Asset serving validation

**Date:** 2025-03-14  
**Purpose:** Post-fix checklist to confirm production serves brand and favicon static assets.

## Pre-requisites

- Fix applied: CI verifies brand/favicon in `.open-next/assets`; production deploy triggered from current `main` (re-run "Deploy Cloudflare (Production)" or push to `main`).
- After deploy completes, run the checks below.

## Validation steps

1. **Rebuild (local sanity check)**  
   From repo root: `bun run cf:build`  
   Confirm in `apps/web/.open-next/assets/`: `brand/aistroyka-logo.png`, `brand/aistroyka-icon.png`, `favicon.ico`, `favicon-32x32.png`.

2. **Live URLs (production)**  
   Base: `https://aistroyka.ai`

   | Check | URL | Expected |
   |-------|-----|----------|
   | Homepage | `/` | 200, new design/layout |
   | Logo | `/brand/aistroyka-logo.png` | 200 |
   | Icon | `/brand/aistroyka-icon.png` | 200 |
   | Favicon | `/favicon.ico` | 200 |

   Example:
   ```bash
   curl -sS -o /dev/null -w "%{http_code}" https://aistroyka.ai/
   curl -sS -o /dev/null -w "%{http_code}" https://aistroyka.ai/brand/aistroyka-logo.png
   curl -sS -o /dev/null -w "%{http_code}" https://aistroyka.ai/brand/aistroyka-icon.png
   curl -sS -o /dev/null -w "%{http_code}" https://aistroyka.ai/favicon.ico
   ```

## Results (fill after deploy)

| Check | Result (200 / 404 / other) |
|-------|----------------------------|
| Homepage updated | |
| /brand/aistroyka-logo.png | |
| /brand/aistroyka-icon.png | |
| /favicon.ico | |

**Brand assets live:** YES / NO
