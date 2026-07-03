# WEB Production Deployment Proof

**Date:** 2026-06-20  
**Target URL:** `https://aistroyka.ai`

---

## Deploy attempt

| Step | Status |
|------|--------|
| Staging RC deploy + PASS | **NOT DONE** — prerequisite failed |
| Production workflow dispatch | **NOT EXECUTED** |
| Production buildStamp change | **NOT VERIFIED** |

---

## Production state (unchanged)

```json
{"ok":true,"env":"production","buildStamp":{"sha7":"ff537c8","buildTime":"2026-06-20 14:58"}}
```

Production remains on **`origin/main`** — pre-Liquid Glass public site.

---

## Blocker

Production deploy per runbook requires:

1. Staging deploy of `release/web-pilot-rc` **PASS**
2. Post-deploy pilot smoke on staging (workflow)
3. Manual or chained production dispatch with validated ref

**None completed in this audit run.**

---

## Operator production path (after staging PASS)

```bash
gh workflow run "Deploy Cloudflare (Production)" \
  --ref release/web-pilot-rc \
  -f ref=release/web-pilot-rc
```

Verify:

```bash
curl -sS https://aistroyka.ai/api/v1/health | jq .buildStamp
# Expect sha7 != ff537c8
curl -sS https://www.aistroyka.ai/api/v1/health | jq .buildStamp
```

Protected route smoke:

- `/en/owner` → 403 (anonymous)
- `/en/login` → 200
- Dashboard/portal → auth gate

---

## Production deploy verdict

**Web production updated: NO**

**Proof status:** **NOT EXECUTED — blocked by staging gap**
