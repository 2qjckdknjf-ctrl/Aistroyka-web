# Admin Domain — Rollout Plan

**Date:** 2026-07-03  
**Target:** `admin.aistroyka.ai`  
**Status:** Execution plan — no changes applied

---

## Phase overview

| Phase | Name | Owner | Duration est. |
|-------|------|-------|---------------|
| 0 | Preconditions | Eng + owner | 1–2 days |
| 1 | DNS + Cloudflare Access | Owner (Cloudflare) | 1 day |
| 2 | Worker host routing | Eng + owner | 1 day |
| 3 | App host enforcement | Engineering | 2–3 days |
| 4 | Security validation | Eng + owner | 1 day |
| 5 | ROMA owner review | Owner | 0.5 day |
| 6 | Deprecation cleanup | Engineering | 2–4 weeks after cutover |

---

## Phase 0 — Preconditions

### Engineering

- [ ] `security/platform-admin-separation` merged to `main`
- [ ] Production Worker deploy current (`buildStamp` verified on staging then prod)
- [ ] P0 lockdown tests green (`platform-admin` test suite)
- [ ] ROMA trust hardening deployed (read-only dashboard)
- [ ] Rollback plan reviewed (`ADMIN_DOMAIN_ROLLBACK_PLAN.md`)

### Owner

- [ ] Platform owner accounts confirmed in `platform_owner_grants`
- [ ] Operator email list for Cloudflare Access documented
- [ ] MFA devices enrolled for all operators
- [ ] Cloudflare zone admin access confirmed
- [ ] Decision: staging admin host (`admin-staging.aistroyka.ai`) yes/no

### Environment

- [ ] Document production Worker secret inventory
- [ ] Prepare `OWNER_ALLOWED_HOSTS=admin.aistroyka.ai` (do not set until Phase 3)
- [ ] Optional: `OWNER_IP_ALLOWLIST` for operator IPs
- [ ] `OWNER_AUDIT_DENIED=1` ready for Phase 4

**Exit criteria:** Main branch contains platform admin separation; owners ready for Access.

---

## Phase 1 — DNS + Cloudflare Access

**Owner executes** per `ADMIN_DOMAIN_CLOUDFLARE_PLAN.md`.

### Steps

1. Add custom domain `admin.aistroyka.ai` to `aistroyka-web-production` (or CNAME + route)
2. Wait for TLS certificate **Active**
3. Create Cloudflare Access application:
   - Domain: `admin.aistroyka.ai`
   - Policy: allow operator emails/groups
   - MFA: required
   - Session: 8h / 30m idle
   - Bypass: none
4. **Do not set `OWNER_ALLOWED_HOSTS` yet**

### Validation (Phase 1)

```bash
# Expect Access challenge (302/401 to CF Access), not 522/525
curl -sI "https://admin.aistroyka.ai/" | head -20

# Non-allowlisted identity should fail at Access (manual browser test)
```

**Exit criteria:** Operator can pass Access challenge; TLS valid; Worker responds (may 403/404 at app layer — OK).

---

## Phase 2 — Worker host routing

### Steps

1. Confirm `admin.aistroyka.ai` routes to same Worker as `aistroyka.ai`
2. Verify `GET https://admin.aistroyka.ai/api/v1/health` returns app health (public health OK on both hosts initially)
3. Document route in Cloudflare dashboard (screenshot for ops runbook)
4. Optional: deploy staging admin host first

### Validation

```bash
curl -s "https://admin.aistroyka.ai/api/v1/health" | jq '.buildStamp'
curl -s "https://aistroyka.ai/api/v1/health" | jq '.buildStamp'
# SHA should match same production deploy
```

**Exit criteria:** Admin host serves same Worker build as apex.

---

## Phase 3 — App host enforcement

**Engineering PR** (separate from this docs commit).

### 3a — Redirects (low risk deploy)

Code changes:

- Wire `isPlatformAdminHost()` into middleware
- Public host `/platform-admin` → 302 `https://admin.aistroyka.ai/...`
- Admin host `/` → 302 `/ru/platform-admin`
- Admin host: block tenant dashboard/marketing routes

Deploy to production.

**`OWNER_ALLOWED_HOSTS` still unset** during 3a.

### 3b — API host binding

- Public host `/api/v1/platform/*` → 403 `platform_admin_host_required`
- Verify `/api/v1/platform/*` works on admin host with owner session

### 3c — Enforce allowlist

Set Worker secret:

```
OWNER_ALLOWED_HOSTS=admin.aistroyka.ai
```

### Validation

| Check | Expected |
|-------|----------|
| `aistroyka.ai/ru/platform-admin` | 302 → admin host |
| `admin.aistroyka.ai/ru/platform-admin` | 200 (after Access + login + grant) |
| `admin.aistroyka.ai/ru/dashboard` | 404 or redirect to public |
| `aistroyka.ai/api/v1/platform/overview` | 403 |
| `admin.aistroyka.ai/api/v1/platform/overview` | 200 with owner auth |

**Exit criteria:** Canonical entry is admin host; public host no longer primary for platform admin.

---

## Phase 4 — Security validation

Run full checklist: `ADMIN_DOMAIN_VALIDATION_CHECKLIST.md`.

### Mandatory checks

- [ ] Tenant admin blocked on admin host (Access + app)
- [ ] Unauthenticated blocked (403)
- [ ] Platform owner allowed end-to-end
- [ ] Platform APIs protected (grant + host)
- [ ] System cron routes not callable from tenant UI
- [ ] Security headers on admin host HTML + API
- [ ] `robots: noindex` on platform admin pages
- [ ] Audit event on platform API read
- [ ] `OWNER_AUDIT_DENIED=1` logging verified

**Exit criteria:** All checklist items PASS.

---

## Phase 5 — ROMA owner review

### Operator walkthrough

1. Open `https://admin.aistroyka.ai` → Access MFA → login
2. Navigate to `/ru/platform-admin/testing`
3. Verify owner summary visible without scrolling
4. Verify release decision, confidence, coverage narrative
5. Confirm **no** Run/Execute/Deploy buttons
6. Confirm read-only badge
7. Open browser devtools → confirm no client-side `fetch` to execute tests

### Sign-off

| Item | Owner sign-off |
|------|----------------|
| ROMA dashboard trustworthy | YES/NO |
| Admin host acceptable for daily ops | YES/NO |
| Public `/platform-admin` redirect acceptable | YES/NO |

**Exit criteria:** Owner sign-off YES on all three.

---

## Phase 6 — Deprecation cleanup

**Not immediate** — schedule 90–180 days post-cutover.

| Item | Action |
|------|--------|
| `/api/v1/owner/*` | Monitor traffic → 410 → remove |
| `/api/v1/admin/billing|leads/*` | Remove delegates |
| `/[locale]/owner` route group | Remove |
| Dead `OwnerConsoleClient` shim | Remove |
| Public `/platform-admin` redirect | Change 302 → 404 |
| ROMA "preferred host pending" copy | Update to deployed |
| `docs/ENVIRONMENT-VARIABLES.md` | Document `OWNER_ALLOWED_HOSTS` as required |

---

## Application routing summary (Phase 3 code)

See `ADMIN_DOMAIN_TARGET_ARCHITECTURE.md` §3–4 for full routing table.

Key implementation files:

- `middleware.ts` — host mode branching
- `lib/platform-admin/host-policy.ts` — host helpers
- New redirect helpers for public → admin

Tests: `middleware.host.test.ts`, extend `middleware-paths.test.ts`.

---

## Communication plan

| Audience | Message |
|----------|---------|
| Platform operators | New URL `admin.aistroyka.ai`; MFA required; bookmark testing page |
| Engineering | No platform admin testing on public URL after Phase 3c |
| Tenant admins | No change — they never had platform admin access |

---

## Timeline recommendation

| Week | Activity |
|------|----------|
| W0 | Merge branch; Phase 0 |
| W1 | Phase 1–2 (owner Cloudflare) |
| W2 | Phase 3a deploy (redirects) |
| W2 | Phase 3b–3c (API host + allowlist) |
| W3 | Phase 4–5 validation + owner review |
| W12+ | Phase 6 deprecation |

---

## Rollout verdict gates

| Gate | Required for go-live |
|------|----------------------|
| Access MFA live | YES |
| TLS active | YES |
| Redirects working | YES |
| `OWNER_ALLOWED_HOSTS` set | YES |
| Tenant admin negative test | YES |
| ROMA owner review | YES |
| Deprecation cleanup | NO (follow-on) |
