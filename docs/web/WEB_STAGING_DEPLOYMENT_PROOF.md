# WEB Staging Deployment Proof

**Date:** 2026-06-20  
**Target branch:** `release/web-pilot-rc` @ `9d6a7812`  
**Target URL:** `https://staging.aistroyka.ai`

---

## Deploy attempt

| Step | Status | Detail |
|------|--------|--------|
| Push `release/web-pilot-rc` to origin | **DONE** | `git push -u origin release/web-pilot-rc` succeeded |
| Trigger staging workflow | **NOT EXECUTED** | Local `gh` CLI broken (x86_64 on ARM64); no GitHub token configured |
| Verify staging buildStamp | **NOT VERIFIED** | Staging still on `ff537c8` as of audit time |

---

## Staging state before deploy (baseline)

```json
{"ok":true,"env":"staging","buildStamp":{"sha7":"ff537c8","buildTime":"2026-06-20 14:54"}}
```

**Expected after RC deploy:** `buildStamp.sha7` prefix `9d6a781`.

---

## Operator action required

### Option A — GitHub UI

1. Actions → **Deploy Cloudflare (Staging)**
2. Run workflow → Branch: `release/web-pilot-rc`
3. Input `ref`: `release/web-pilot-rc`

### Option B — gh CLI (arm64)

```bash
brew install gh
gh auth login
gh workflow run "Deploy Cloudflare (Staging)" \
  --ref release/web-pilot-rc \
  -f ref=release/web-pilot-rc
gh run watch
```

### Post-deploy verification checklist

```bash
curl -sS https://staging.aistroyka.ai/api/v1/health | jq .
curl -sS -o /dev/null -w "%{http_code}\n" https://staging.aistroyka.ai/en/login
curl -sS -o /dev/null -w "%{http_code}\n" https://staging.aistroyka.ai/en/owner
# LG markers on staging landing:
curl -sS --max-time 15 https://staging.aistroyka.ai/en | rg 'liquid-glass|AppGlassRoot' | head
```

Surfaces to spot-check with pilot credentials:

- [ ] Public landing (LG hero)
- [ ] Login → dashboard
- [ ] Projects, reports, documents, costs tabs
- [ ] Admin home
- [ ] Owner (403 without grant)
- [ ] Portal projects

---

## Staging deploy verdict

**NOT DEPLOYED** in this audit run — **BLOCKED** by missing GitHub CLI auth on operator host.

**Staging proof status:** **FAIL (not attempted)**

Do **not** mark web production updated or pilot-ready until staging proof completes.
