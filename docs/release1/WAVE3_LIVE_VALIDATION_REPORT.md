# Wave 3 — Live validation report (post-closure)

**Date:** 2026-03-28

---

## Automated tests (repo)

| Suite | Result |
|-------|--------|
| `apps/web` Vitest full | **1117** passed (includes `lite-allow-list` updates) |
| Targeted: `lib/api/lite-allow-list.test.ts` | **PASS** |

**Command:**

```bash
cd apps/web && npx vitest run
```

---

## Android compile

```bash
cd android && ./gradlew :shared:compileDebugKotlin
```

**Result:** **PASS** (after `WorkerApi.task` return type aligned with `TaskDetailDto`).

---

## Production build / cf

- **Not run** in this session (`npm run build` / Cloudflare OpenNext from CI). **Recommended** on PR before merge.

---

## Focused live checks (operator)

| Check | Tool |
|-------|------|
| `pilot_launch.sh` | `./scripts/smoke/pilot_launch.sh` — **PASS** (see pilot report) |
| Task detail | `curl --location-trusted -H "Authorization: Bearer …"` … `/api/v1/tasks/:id` |
| Submit without proof | `POST /api/v1/worker/report/submit` — **fail** expected post-deploy (**400** `proof_required`) |
| Report read scope | `GET /api/v1/reports/:id` as non-owner |

---

## Regression

- No Vitest regressions observed after `lite-allow-list` + Android DTO fix.

---

**Status:** **Repo validation GREEN**; **live** verification **incomplete** until deploy + re-run (see post-audit).
