# Admin Domain — Rollback Plan

**Date:** 2026-07-03  
**Principle:** Rollback must **not** expose platform admin on the public host without Access protection

---

## 1. Rollback decision matrix

| Symptom | Severity | Rollback type |
|---------|----------|---------------|
| DNS does not resolve | High | DNS rollback |
| TLS certificate failure | High | DNS/route rollback |
| Cloudflare Access lockout (all operators) | Critical | Access policy rollback |
| Worker 5xx on admin host only | High | Route rollback |
| App host detection bug (404 loops) | High | App deploy rollback |
| Platform owner auth failure (grant) | Critical | App/env rollback — **not** Access bypass |
| API guard false positive (403 all APIs) | High | `OWNER_ALLOWED_HOSTS` unset |
| Emergency need platform admin access | Critical | Controlled break-glass |

---

## 2. DNS issue rollback

### Symptoms

- `admin.aistroyka.ai` NXDOMAIN or wrong target
- SSL handshake errors (525/526)

### Actions

1. Remove or disable custom domain binding in Workers dashboard
2. Remove CNAME `admin` record if manually created
3. Verify `aistroyka.ai` unaffected

### Operator access during DNS rollback

- Use existing fallback: `https://aistroyka.ai/ru/platform-admin`
- **Requires** platform owner grant (unchanged)
- Document temporary URL in ops channel

**Do not** announce public fallback as permanent.

---

## 3. Cloudflare Access lockout rollback

### Symptoms

- All operators denied at Access layer
- IdP outage blocks MFA
- Misconfigured allow policy

### Actions (in order)

1. **Owner super-admin** logs into Cloudflare Zero Trust dashboard
2. Edit Access application policy → add emergency operator email
3. If IdP broken: temporary **emergency policy** with one-time password (CF emergency bypass) — **time-boxed 1 hour**
4. Document incident; revert emergency policy after restore

### Never do

- Disable Access application permanently
- Add `0.0.0.0/0` bypass rule
- Publish admin host without Access "temporarily"

### Alternative

- Use public host fallback `aistroyka.ai/ru/platform-admin` (grant still required)
- Access outage does not block public host path unless `OWNER_ALLOWED_HOSTS=admin.aistroyka.ai` already set

**If `OWNER_ALLOWED_HOSTS` already enforced:** unset it first (see §7).

---

## 4. Worker routing failure rollback

### Symptoms

- Admin host 522/523/524
- Admin host serves wrong Worker or stale build

### Actions

1. Remove `admin.aistroyka.ai` custom domain / route from Worker
2. Redeploy last known good production build to `aistroyka-web-production`
3. Verify apex health: `curl https://aistroyka.ai/api/v1/health`

### Partial failure (admin broken, apex OK)

- Operators use public fallback `/platform-admin`
- Unset `OWNER_ALLOWED_HOSTS` if set

---

## 5. App host detection bug rollback

### Symptoms

- Redirect loop between hosts
- 404 on all admin host paths
- Tenant dashboard accidentally served on admin host

### Actions

1. **Revert** middleware host-routing deploy (git revert PR)
2. Redeploy previous production SHA via Deploy Cloudflare workflow
3. Unset `OWNER_ALLOWED_HOSTS` immediately:

```bash
# Owner: Cloudflare Dashboard → Worker → Variables
# Remove or clear OWNER_ALLOWED_HOSTS
```

4. Verify public host `/platform-admin` works for platform owners

### Verification after revert

```bash
curl -sI "https://aistroyka.ai/ru/platform-admin" | head -5
# Expect 200 or 302 to login — not loop
```

---

## 6. Platform owner auth failure rollback

### Symptoms

- Valid operators get 403 `no_grant` everywhere
- Supabase session OK but grant query fails

### Diagnosis

- DB connectivity / `platform_owner_grants` table
- Not an admin host issue

### Actions

1. **Do not** disable Access or owner gate
2. Fix Supabase / grant rows via service role (owner ops)
3. If middleware regression: revert app deploy
4. Enable break-glass grant row if emergency tenant visibility needed

---

## 7. API guard false positive rollback

### Symptoms

- Platform owner gets 403 `owner_gate` or `host_blocked` on all APIs
- ROMA dashboard empty/errors

### Actions

1. Clear `OWNER_ALLOWED_HOSTS` (allows all hosts again)
2. If host middleware deployed: revert host-binding PR
3. Confirm APIs work on `aistroyka.ai` with owner session (temporary)

```bash
# Test with owner cookie
curl -s "https://aistroyka.ai/api/v1/platform/overview" -H "Cookie: ..." | jq .
```

4. Root-cause fix forward — re-enforce allowlist only after validation

---

## 8. Emergency break-glass

### When

- Admin host down AND public fallback blocked AND production incident requires platform ops

### Procedure

1. Owner approval (second person)
2. Unset `OWNER_ALLOWED_HOSTS` via Worker dashboard
3. Temporarily disable public→admin redirect (revert deploy or feature flag)
4. Operators use `https://aistroyka.ai/ru/platform-admin`
5. Insert time-boxed `platform_break_glass_grants` if content access needed
6. Post-incident: restore admin host path within 24h; write incident report

### Audit

- Log all break-glass actions in `docs/incidents/`
- Review `platform_owner_audit_log` for break-glass period

---

## 9. Rollback order (safe sequence)

To avoid **exposing platform admin without Access**:

```
Step 1: Unset OWNER_ALLOWED_HOSTS (if set)
Step 2: Revert app host-routing deploy (if deployed)
Step 3: Fix or remove admin DNS/route (if broken)
Step 4: Keep Cloudflare Access in place on admin host (even if broken — doesn't affect public)
Step 5: Communicate public fallback URL to operators
Step 6: Root-cause fix + re-rollout
```

**Never:**

- Remove grant checks
- Disable `gateOwnerRequest`
- Expose `/api/v1/platform/*` without authentication on public host

---

## 10. Rollback validation

After any rollback:

| Check | Expected |
|-------|----------|
| `aistroyka.ai/api/v1/health` | 200 |
| Platform owner → public `/platform-admin` | Works (if fallback active) |
| Tenant admin → `/platform-admin` | 403 |
| Tenant admin → `/api/v1/platform/*` | 403 |
| Public marketing site | Unaffected |
| No grant bypass introduced | Confirmed |

---

## 11. Recovery / re-rollout

After rollback stabilizes:

1. Fix root cause in staging (`admin-staging` or staging fallback)
2. Re-run `ADMIN_DOMAIN_VALIDATION_CHECKLIST.md`
3. Re-apply phases in order: DNS → Access → app → allowlist
4. Owner sign-off before `OWNER_ALLOWED_HOSTS` re-enabled

---

## 12. Contacts and ownership

| Role | Responsibility |
|------|----------------|
| Cloudflare super-admin | Access policy, DNS, routes |
| Platform owner | Grant rows, break-glass approval |
| Engineering | App revert, deploy SHA |
| On-call | Execute checklist, comms |
