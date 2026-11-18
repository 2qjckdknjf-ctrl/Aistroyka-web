# P0 — Production Deploy Truth

**Date:** 2026-07-01  
**Verifier:** Cursor P0 sprint (read-only)

---

## Production URL

| Surface | URL |
|---------|-----|
| Production | https://aistroyka.ai |
| Staging | https://staging.aistroyka.ai |
| Health | `GET /api/v1/health` |

---

## Deployed build

| Field | Value |
|-------|-------|
| **origin/main SHA** | `7f1b42f8c684304eb3b380cb9a8617f6fb9217fe` |
| **sha7** | `7f1b42f` |
| **Production buildStamp** | `{"sha7":"7f1b42f","buildTime":"2026-07-01 12:58"}` |
| **Staging buildStamp** | `{"sha7":"7f1b42f","buildTime":"2026-07-01 12:54"}` |
| **Source ref** | `main` (merge PR #180) |

**Match:** Production deployed SHA **matches** current `origin/main`.

---

## Verification method

1. `git fetch origin main && git rev-parse origin/main` → `7f1b42f8…`
2. `curl -fsS https://aistroyka.ai/api/v1/health` → HTTP 200, `buildStamp.sha7=7f1b42f`
3. GitHub Actions (repo `2qjckdknjf-ctrl/Aistroyka-web`):
   - `Deploy Cloudflare (Staging)` run `28518995401` — **success**, `headSha=7f1b42f8…`
   - `Deploy Cloudflare (Production)` run `28519204745` — **success**, `headSha=7f1b42f8…`

---

## Deployment chain

```
merge to main → Deploy Cloudflare (Staging) → workflow_run → Deploy Cloudflare (Production)
```

Canonical path per `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md`. No manual wrangler deploy used for this verification.

---

## Unknowns / blockers

| Item | Status |
|------|--------|
| Vercel preview noise | Non-canonical; ignore for production truth |
| Worker runtime secrets vs build-time `NEXT_PUBLIC_*` | Build-time vars inlined at cf:build; runtime secrets dashboard-managed |
| Lag between merge and production | **None observed** for PR #180 merge |

---

## Verdict

**FULL** — production deploy truth established with live `buildStamp` matching `origin/main`.
