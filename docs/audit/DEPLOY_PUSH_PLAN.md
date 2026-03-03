# Deploy push plan — synchronize production with repo

**Date:** 2026-03-03  
**Incident:** Production /api/health shows sha7=0e363e4 and no serviceRoleConfigured; root cause is local main ahead of origin (commits not pushed).

---

## Current production state

| Item | Value |
|------|--------|
| **Production buildStamp.sha7** | **0e363e4** |
| **Commit 0e363e4** | docs: update PROD_GROUND_TRUTH and PROD_FINAL_STATUS with final SHA and verification |

---

## Repo state proof (no remote changes yet)

### git status (summary)

- Branch: **main**
- **Your branch is ahead of 'origin/main' by 5 commits.**
- Uncommitted: modified apps/web/middleware.ts, docs/audit/DEPLOY_MISMATCH_RCA.md (not part of push)

### git rev-list --left-right --count origin/main...main

- **0** commits on origin/main not in main  
- **5** commits on main not in origin/main  

### Commits to be pushed (main ^ origin/main)

| SHA (short) | Subject |
|-------------|---------|
| c2c592f | fix(web): ensure redesigned UI renders on prod |
| 2516fb0 | fix(auth): resolve prod login hang and add robust error handling |
| cfacb84 | fix(auth): eliminate prod login hang with deterministic stages + full redirect |
| 88e4c64 | chore(security): supabase live hardening (views, rls, definer exec revoke) |
| **52fb3de** | **fix(health): expose serviceRoleConfigured in prod health** |

The commit that adds **serviceRoleConfigured** to /api/health is **52fb3de** (HEAD of main).

### serviceRoleConfigured in repo

- **File:** apps/web/app/api/health/route.ts  
- **Present:** Yes — line 70: `const serviceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());` and line 77: `serviceRoleConfigured` in response body.  
- **Commit:** 52fb3de  

---

## Expected post-deploy /api/health

After push and successful CI deploy:

- **buildStamp.sha7** must be **52fb3de** (or the SHA of the commit that CI built from, i.e. new HEAD of origin/main after push).
- **serviceRoleConfigured** must be present (boolean).
- **supabaseReachable** should remain true.

Example expected shape:

```json
{
  "ok": true,
  "db": "ok",
  "aiConfigured": false,
  "openaiConfigured": false,
  "supabaseReachable": true,
  "serviceRoleConfigured": true,
  "buildStamp": { "sha7": "52fb3de", "buildTime": "..." }
}
```

---

## Push command

```bash
git push origin main
```

Output captured in docs/audit/DEPLOY_PUSH_LOG.md.
