# Admin Domain — Validation Checklist

**Date:** 2026-07-03  
**Use:** Phase 4 rollout validation + post-deploy regression  
**Hosts:** `aistroyka.ai` (public), `admin.aistroyka.ai` (platform admin)

---

## 0. Preconditions

- [ ] Production `buildStamp.sha7` matches intended merge commit
- [ ] Operator has Cloudflare Access allowlist identity
- [ ] Operator has `platform_owner_grants` row
- [ ] Operator has MFA device enrolled
- [ ] Test tenant admin account available (negative tests)

```bash
# Public health
curl -s "https://aistroyka.ai/api/v1/health" | jq '{ok: .ok, sha: .buildStamp.sha7}'

# Admin health (after DNS)
curl -s "https://admin.aistroyka.ai/api/v1/health" | jq '{ok: .ok, sha: .buildStamp.sha7}'
```

---

## 1. DNS and TLS

| # | Check | Command / action | Pass criteria |
|---|-------|------------------|---------------|
| 1.1 | DNS resolves | `dig +short admin.aistroyka.ai` | Returns CF proxied addresses |
| 1.2 | TLS valid | `curl -sI https://admin.aistroyka.ai/` | No certificate error |
| 1.3 | HSTS (HTML) | After login, inspect response headers | `Strict-Transport-Security` present |

---

## 2. Cloudflare Access

| # | Check | Action | Pass criteria |
|---|-------|--------|---------------|
| 2.1 | Unauthenticated challenge | `curl -sI https://admin.aistroyka.ai/` | Redirect to Cloudflare Access or 403 — not anonymous 200 on protected page |
| 2.2 | Allowlisted operator | Browser login with MFA | Access granted |
| 2.3 | Non-allowlisted user | Browser login with non-operator email | Access denied |
| 2.4 | No bypass rules | CF Zero Trust dashboard review | Zero bypass policies |
| 2.5 | MFA enforced | Policy settings | MFA required |

---

## 3. Public host behavior (post Phase 3)

| # | Check | Command | Pass criteria |
|---|-------|---------|---------------|
| 3.1 | Public health | `curl -s https://aistroyka.ai/api/v1/health` | `ok: true` |
| 3.2 | Platform admin redirect | `curl -sI "https://aistroyka.ai/ru/platform-admin"` | 302 → `admin.aistroyka.ai` (or 404 post-cutover) |
| 3.3 | Platform API blocked | `curl -sI "https://aistroyka.ai/api/v1/platform/overview"` | 403 (with or without session) |
| 3.4 | Tenant dashboard works | Browser: tenant user → `/ru/dashboard` | 200 (not redirected to admin) |
| 3.5 | Public marketing | `curl -sI "https://aistroyka.ai/ru"` | 200 |

```bash
# Redirect target (Phase 3a)
curl -sI "https://aistroyka.ai/ru/platform-admin/testing" | grep -i location

# Platform API host guard
curl -s "https://aistroyka.ai/api/v1/platform/testing/quality" \
  -H "Cookie: <owner-session>" | jq '.code // .error'
# Expect platform_admin_host_required or forbidden — not 200 from public host
```

---

## 4. Admin host behavior

| # | Check | Command / action | Pass criteria |
|---|-------|------------------|---------------|
| 4.1 | Root redirect | `curl -sI "https://admin.aistroyka.ai/"` (with Access cookie) | 302 → `/ru/platform-admin` |
| 4.2 | Platform admin page | Browser: `/ru/platform-admin` | 200, PlatformAdminShell |
| 4.3 | Tenant dashboard blocked | `curl -sI "https://admin.aistroyka.ai/ru/dashboard"` | 404 or redirect to public |
| 4.4 | Public homepage blocked | `curl -sI "https://admin.aistroyka.ai/ru"` | Not public marketing homepage |
| 4.5 | Platform API reachable | `curl -s "https://admin.aistroyka.ai/api/v1/platform/overview"` + owner cookie | 200 JSON |

---

## 5. Authorization negative tests

| # | Actor | Action | Pass criteria |
|---|-------|--------|---------------|
| 5.1 | Anonymous | `GET admin.../platform-admin` | Access challenge or 403 |
| 5.2 | Anonymous | `GET admin.../api/v1/platform/overview` | 403 |
| 5.3 | Authenticated, no grant | Platform admin page | 403 Forbidden |
| 5.4 | Tenant admin | `GET aistroyka.ai/ru/platform-admin` | Redirect then Access deny OR 403 at app |
| 5.5 | Tenant admin | `GET aistroyka.ai/api/v1/platform/overview` | 403 |
| 5.6 | Tenant admin | `POST /api/v1/admin/flags` | 403 `platform_admin_required` |
| 5.7 | OWNER_READONLY | `POST /api/v1/platform/billing/reprocess-event` | 403 write required |

```bash
# Tenant admin session — platform API (public host)
curl -s "https://aistroyka.ai/api/v1/platform/leads" \
  -H "Cookie: <tenant-admin-session>" | jq '.code // .error'
# Expect forbidden / owner_gate
```

---

## 6. Platform owner positive tests

| # | Action | Pass criteria |
|---|--------|---------------|
| 6.1 | Login via Supabase on admin host | Session established |
| 6.2 | `/ru/platform-admin` overview | 200 |
| 6.3 | `/ru/platform-admin/billing` | 200 |
| 6.4 | `/ru/platform-admin/leads` | 200 |
| 6.5 | `/ru/platform-admin/testing` | 200, ROMA summary visible |
| 6.6 | `GET /api/v1/platform/testing/quality` | 200 JSON dashboard |
| 6.7 | `GET /api/v1/platform/audit` | 200 |
| 6.8 | Legacy `GET /api/v1/owner/overview` | 200 + Deprecation header |

---

## 7. Security headers

```bash
# Admin host HTML (authenticated page)
SECURITY_HEADERS_BASE_URL=https://admin.aistroyka.ai \
  SECURITY_HEADERS_PATH=/ru/platform-admin \
  bash scripts/smoke/security_headers.sh

# Admin host API
curl -sI "https://admin.aistroyka.ai/api/v1/platform/health" \
  -H "Cookie: <owner-session>" | grep -E 'X-Frame-Options|X-Content-Type-Options|Referrer-Policy'
```

| # | Header | Pass criteria |
|---|--------|---------------|
| 7.1 | `X-Content-Type-Options: nosniff` | Present on API + HTML |
| 7.2 | `X-Frame-Options: DENY` | Present |
| 7.3 | `Content-Security-Policy` | Present on HTML |
| 7.4 | `Strict-Transport-Security` | Present on HTML (prod) |
| 7.5 | No indexing | `X-Robots-Tag` or meta robots noindex on platform admin |

---

## 8. Audit logging

| # | Check | Pass criteria |
|---|-------|---------------|
| 8.1 | Platform API read | Row in `platform_owner_audit_log` for `owner_api_GET` |
| 8.2 | Denied attempt | With `OWNER_AUDIT_DENIED=1`, denied call logged |
| 8.3 | Gate deny | `host_blocked` logged when wrong host + allowlist enforced |
| 8.4 | Cloudflare Access | Login event visible in Zero Trust logs |

```sql
-- Run in Supabase SQL editor (service role)
SELECT action, entity_id, created_at
FROM platform_owner_audit_log
ORDER BY created_at DESC
LIMIT 10;
```

---

## 9. ROMA dashboard (Phase 5)

| # | Check | Pass criteria |
|---|-------|---------------|
| 9.1 | Page loads on admin host | Owner summary above fold |
| 9.2 | Release decision visible | READY / NOT READY / UNKNOWN badge |
| 9.3 | No execution buttons | No Run/Execute/Deploy/Fix |
| 9.4 | Read-only badge | Visible |
| 9.5 | Data coverage narrative | Percentage + blind spots |
| 9.6 | No client fetch loop | Network tab: no polling execution endpoints |

Manual: open `https://admin.aistroyka.ai/ru/platform-admin/testing`

---

## 10. System API protection

| # | Check | Pass criteria |
|---|-------|---------------|
| 10.1 | Cron without secret | `POST /api/v1/admin/jobs/cron-tick` → 401/403 |
| 10.2 | Cron with secret only | Works without user session (if cron configured) |
| 10.3 | Tenant admin cron UI | No cron trigger buttons in tenant operator workbench |

---

## 11. Automated test suite (pre-deploy)

```bash
cd apps/web && bun run test -- \
  lib/platform-admin/middleware-paths.test.ts \
  lib/platform-admin/deprecation.test.ts \
  lib/platform-admin/roma-engineering-intelligence.test.ts \
  lib/platform-admin/roma-quality-dashboard.page.test.ts \
  lib/api/require-platform-admin-legacy-route.test.ts
```

- [ ] All tests pass before merge
- [ ] `cf:build` passes in CI

---

## 12. Owner / operator access flow (end-to-end)

```
1. Operator opens https://admin.aistroyka.ai
2. Cloudflare Access → email + MFA
3. Redirect to /ru/platform-admin (if root)
4. Supabase login (if no session)
5. gateOwnerRequest → platform_owner_grants OK
6. Platform admin shell renders
7. ROMA Testing → read-only dashboard
8. API calls → /api/v1/platform/* audited
```

- [ ] Documented flow matches observed behavior
- [ ] Operator completes flow without engineering assistance

---

## 13. Sign-off

| Role | Name | Date | PASS/FAIL |
|------|------|------|-----------|
| Platform owner | | | |
| Engineering | | | |
| Security review | | | |

**Overall:** ___ / ___ checks passed

---

## 14. Quick reference commands

```bash
# SHA parity
curl -s https://aistroyka.ai/api/v1/health | jq .buildStamp.sha7
curl -s https://admin.aistroyka.ai/api/v1/health | jq .buildStamp.sha7

# Security headers (public baseline)
bash scripts/smoke/security_headers.sh

# Platform path classification (local)
cd apps/web && bun run test -- lib/platform-admin/middleware-paths.test.ts
```
