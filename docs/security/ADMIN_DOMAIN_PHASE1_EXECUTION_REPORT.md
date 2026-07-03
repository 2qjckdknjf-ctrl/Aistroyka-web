# Admin Domain — Phase 1 Execution Report

**Date:** 2026-07-03  
**Branch:** `security/platform-admin-separation`  
**Target:** `https://admin.aistroyka.ai`  
**Executor:** Engineering (automated script + API probes)

---

## 1. Summary

| Item | Status |
|------|--------|
| DNS `admin.aistroyka.ai` | **NOT LIVE** — no resolution |
| TLS | **N/A** — host does not resolve |
| Worker route/custom domain | **NOT APPLIED** — API token read-only for writes |
| Cloudflare Access | **NOT CONFIGURED** — token lacks Zero Trust permissions |
| `OWNER_ALLOWED_HOSTS` | **NOT SET** (correct for Phase 1) |
| Public production (`aistroyka.ai`) | **HEALTHY** — no outage |
| App host recognition (compatibility) | **PREPARED** — `X-Aistroyka-Host-Profile` header |

**Phase 1 infrastructure bring-up is blocked on Cloudflare API token permissions or Dashboard login.**

---

## 2. Validation evidence

### Public production (unchanged)

```bash
curl -s https://aistroyka.ai/api/v1/health
# {"ok":true,"buildStamp":{"sha7":"7f1b42f",...}}

curl -sI https://aistroyka.ai/ru | head -3
# HTTP/2 200
```

### Admin host (pre-infrastructure)

```bash
dig +short admin.aistroyka.ai
# (empty)

curl -sI https://admin.aistroyka.ai/
# connection fails / no DNS
```

### Existing production worker routes (read OK)

```
aistroyka.ai/*      -> aistroyka-web-production
www.aistroyka.ai/*  -> aistroyka-web-production
```

Source: `GET /accounts/{id}/workers/services/aistroyka-web-production/environments/production/routes`

### Write attempts (failed — token scope)

```
POST .../routes     -> 10405 Method not allowed for this authentication scheme
POST .../domains    -> 10405 Method not allowed for this authentication scheme
GET  .../access/apps -> 10000 Authentication error
```

Token ID verified active: `00790b4e3925a42c7069c64e115ee8af`  
Account: `864f04d729c24f574a228558b40d7b82`

---

## 3. Repository changes (compatibility mode)

| Change | Purpose |
|--------|---------|
| `lib/platform-admin/host-policy.ts` | `resolveHostProfile`, `isPublicProductHost` |
| `middleware.ts` | `X-Aistroyka-Host-Profile` on responses (no blocking) |
| `scripts/cf-admin-domain-phase1.mjs` | Idempotent Phase 1 Cloudflare automation |
| `wrangler.admin-phase1.toml` | Reference custom domain config (not deployed) |
| `wrangler.deploy.toml` | Commented `OWNER_ALLOWED_HOSTS` (Phase 3 only) |
| `lib/platform-admin/host-policy.test.ts` | Unit tests |

**Not deployed to production Worker** in this slice (no `wrangler deploy`).

---

## 4. Owner action required to complete Phase 1

### Option A — Dashboard (fastest)

1. **Workers & Pages** → `aistroyka-web-production` → **Domains** → Add **Custom Domain** `admin.aistroyka.ai`
2. Confirm TLS certificate **Active**
3. **Zero Trust** → **Access** → Applications → Add `admin.aistroyka.ai`
   - Policy: allow platform operator emails
   - **MFA required**
   - No bypass rules
4. Re-run validation checklist (`ADMIN_DOMAIN_VALIDATION_CHECKLIST.md` §1–2)

### Option B — Upgraded API token + script

Create token with:

- Account → Workers Scripts → Edit
- Zone `aistroyka.ai` → DNS → Edit
- Zone `aistroyka.ai` → Workers Routes → Edit
- Account → Access: Apps and Policies → Edit

Then:

```bash
cd apps/web
source .env.cf
CLOUDFLARE_ACCESS_OPERATOR_EMAILS="owner@example.com" node scripts/cf-admin-domain-phase1.mjs
```

---

## 5. What was intentionally not done

- `OWNER_ALLOWED_HOSTS` not set on Worker
- No public `/platform-admin` redirect or blocking
- No legacy alias removal
- No ROMA changes
- No production Worker deploy

---

## 6. Remaining work for Phase 2

After Phase 1 infra is live:

1. Verify `curl -s https://admin.aistroyka.ai/api/v1/health` matches apex `buildStamp`
2. Verify Cloudflare Access challenge on `https://admin.aistroyka.ai/`
3. Deploy app with host profile header (this branch) if not yet on production
4. Document route/custom domain in ops runbook
5. Proceed to Phase 3 app host enforcement (separate PR)

---

## 7. Verdicts

| Verdict | Value |
|---------|-------|
| `ADMIN_DOMAIN_PHASE1_COMPLETE` | **NO** — DNS/Access/Worker binding not live |
| `READY_FOR_PHASE2_HOST_ROUTING` | **NO** — complete Phase 1 infra first |
| `PRODUCTION_HEALTH` | **HEALTHY** |
| `APP_PREP_COMPLETE` | **YES** — host recognition + automation script ready |
