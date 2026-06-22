# AISTROYKA Live/Staging Smoke Runbook

**Last updated:** 2026-06-22  
**Applies to:** AISTROYKA web (`apps/web`), GitHub repo **Aistroyka-web**  
**Related:** [Deployment source of truth](../runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md), issue #115 audit (`docs/reconciliation/issue-115-live-staging-smoke-stacked-audit/`)

---

## 1. Purpose

This runbook defines the **operator-safe** process for running live/staging smoke checks **after** a merged PR and a **known deployment**.

It applies to read-only smoke (for example security headers) and sets the gate for any smoke that could mutate data. It does **not** replace CI, post-deploy workflow gates, or product-specific pilot runbooks.

**Canonical runtime:** Cloudflare Workers (OpenNext). Staging: `https://staging.aistroyka.ai`. Production: `https://aistroyka.ai` and `https://www.aistroyka.ai`.

---

## 2. Non-negotiable safety rules

Do **not** run live smoke unless **all** of the following are true for the intended target:

| Rule | Requirement |
|------|-------------|
| Deploy confirmed | GitHub Actions deploy run **success** for the expected commit SHA |
| Health confirmed | Target `/api/v1/health` returns `buildStamp.sha7` matching expected commit (first 7 chars) |
| Staging first | Run staging smoke before production when validating a new merge |
| Production approval | **Explicit operator approval** required before production smoke (even read-only) |
| No deploy from smoke task | Smoke operators do **not** trigger, rerun, or cancel deploys |
| No env changes | Do not change Cloudflare, Vercel, GitHub, or Supabase settings during smoke |
| No secrets in evidence | Check env **presence** only; never print tokens, JWTs, or service role keys |
| Read-only default | Default smoke is GET/curl header or health checks only |
| No service role in read-only smoke | `scripts/smoke/security_headers.sh` must not use `SUPABASE_SERVICE_ROLE_KEY` |
| Clean worktree | Unexpected local file changes → **stop**; revert incidental noise (for example `package-lock.json`) before documenting evidence |

**Forbidden without a separate, explicit operator gate:** creating/deleting users, tenant membership changes, migrations, manual production deploy, runtime flag toggles, or any POST/PATCH/PUT/DELETE against live data.

---

## 3. Deployment confirmation

Before **any** live smoke against staging or production:

### 3.1 Confirm merge commit on `main`

```bash
git fetch origin main
git rev-parse origin/main
```

Record full SHA and `sha7` (first 7 characters).

### 3.2 Confirm deploy workflow success

| Environment | Workflow | Typical trigger |
|-------------|----------|-----------------|
| Staging | **Deploy Cloudflare (Staging)** | Push to `main` |
| Production | **Deploy Cloudflare (Production)** | After staging deploy success on `main` |

```bash
gh run list --workflow "Deploy Cloudflare (Staging)" --limit 5
gh run list --workflow "Deploy Cloudflare (Production)" --limit 5
gh run view <RUN_ID> --json status,conclusion,headSha,url
```

Required:

- `status`: `completed`
- `conclusion`: `success`
- `headSha`: matches expected merge commit on `main`

### 3.3 Confirm health `buildStamp`

```bash
curl -fsS https://staging.aistroyka.ai/api/v1/health
curl -fsS https://aistroyka.ai/api/v1/health
curl -fsS https://www.aistroyka.ai/api/v1/health   # optional www parity
```

Required JSON fields:

- `"ok": true` (or documented expected status for the route)
- `"buildStamp": { "sha7": "<expected>", "buildTime": "..." }`

**Rule:** `buildStamp.sha7` must equal the expected commit prefix (for example `db850f7` for merge commit `db850f7075b9d344f10f04b9da39f642a640e603`).

If deploy is **in progress**, **failed**, or **cancelled**, or `buildStamp` does not match → **do not run smoke**; report blocker.

### 3.4 Order of operations

1. Merge to `main` and validate locally (CI Check on PR).
2. Wait for **staging** deploy success + staging health `buildStamp`.
3. Run **staging** read-only smoke (if approved for the task).
4. Wait for **production** deploy success + production health `buildStamp`.
5. Obtain **explicit operator approval** for production smoke.
6. Run **production** read-only smoke.

---

## 4. Read-only smoke script policy

Use **`scripts/smoke/security_headers.sh`** as the canonical read-only example (validated on PR #120).

| Check | Requirement |
|-------|-------------|
| HTTP methods | `curl` GET only (no POST/PATCH/PUT/DELETE) |
| Auth | No login, cookies, or bearer tokens required for checked routes |
| Service role | Must not use `SUPABASE_SERVICE_ROLE_KEY` |
| Data mutation | Must not create/update/delete users, tenants, projects, or storage |
| Output | Header presence/absence checks only; do not commit response bodies with secrets |

Inspect before running:

```bash
sed -n '1,80p' scripts/smoke/security_headers.sh
grep -nE 'curl|POST|PATCH|DELETE|PUT|service_role|SUPABASE_SERVICE' scripts/smoke/security_headers.sh
```

If the script is not clearly read-only → **stop** and triage before running against live URLs.

**Routes checked (5):** public home, auth login, API health, unauthenticated portal API, protected dashboard redirect. Page profile expects CSP + HSTS (HTTPS); API profile expects hardening headers **without** CSP.

---

## 5. Staging smoke procedure

**Preconditions:** staging deploy success; `https://staging.aistroyka.ai/api/v1/health` → `buildStamp.sha7` matches expected commit; operator approval for staging smoke (release operator).

```bash
SECURITY_HEADERS_BASE_URL=https://staging.aistroyka.ai bash scripts/smoke/security_headers.sh
```

Optional locale override: `SECURITY_HEADERS_LOCALE=ru` (default `en`).

**Pass:** script exits `0` and prints `security_headers: PASS`.

---

## 6. Production smoke procedure

**Preconditions (all required):**

- Production deploy workflow **success** for expected commit
- `https://aistroyka.ai/api/v1/health` → `buildStamp.sha7` matches expected commit
- **Explicit operator approval** for production smoke recorded (issue/PR comment or operator sign-off)
- Script verified read-only (section 4)

**Canonical (apex):**

```bash
SECURITY_HEADERS_BASE_URL=https://aistroyka.ai bash scripts/smoke/security_headers.sh
```

**WWW parity (recommended when www is in production DNS):**

```bash
SECURITY_HEADERS_BASE_URL=https://www.aistroyka.ai bash scripts/smoke/security_headers.sh
```

Do **not** run production smoke while deploy run is `in_progress` or if health still shows a prior `buildStamp` (for example old `1e29ce4d` prefix).

---

## 7. Evidence format

Post evidence to the relevant **issue** and **PR** (or operator log). Include:

| Field | Example |
|-------|---------|
| Main commit (full SHA) | `db850f7075b9d344f10f04b9da39f642a640e603` |
| Expected `sha7` | `db850f7` |
| Deployment run URL | `https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/27954493032` |
| Target URL | `https://staging.aistroyka.ai` / `https://aistroyka.ai` |
| Health `buildStamp` | `{"sha7":"db850f7","buildTime":"2026-06-22 13:00"}` |
| Command | `SECURITY_HEADERS_BASE_URL=... bash scripts/smoke/security_headers.sh` |
| Timestamp (UTC) | `2026-06-22T20:30Z` |
| Result | PASS / FAIL / SKIPPED |
| Failures | Missing header name and route label, if any |
| Safety checklist | No deploy performed; no env changes; no data mutation; no users created; no migrations |

Do not paste secrets, JWTs, cookies, or full auth responses.

---

## 8. Skip conditions

**Skip smoke** (report SKIPPED + reason) when:

| Condition | Action |
|-----------|--------|
| Deploy `in_progress` | Wait or skip; do not cancel/rerun deploy from smoke task |
| Deploy `failure` / `cancelled` | Skip; report failing job/step |
| `buildStamp` mismatch | Skip; do not assume partial rollout |
| Script not read-only | Skip until script is reviewed/fixed |
| Production approval missing | Skip production; staging may still run if otherwise safe |
| Working tree dirty (unexpected files) | Revert or stop; do not commit incidental lockfile drift |
| Wrong Supabase/project target for mutable smoke | Skip mutation; read-only header smoke does not need Supabase writes |

---

## 9. Failure handling

On smoke **FAIL**:

1. **Do not** rerun or cancel deploy automatically.
2. **Do not** patch production/staging live config from the smoke task.
3. Capture failing route label and missing/unexpected header from script output.
4. Confirm whether failure is deploy lag, CDN cache, or code regression (health `buildStamp` still required).
5. Open a **focused** issue or PR only after triage; do not broad-merge stale branches.

On deploy **failure**:

- Report workflow run URL and failing job name.
- Do not run production smoke.
- Follow [Deployment source of truth](../runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md) for rollback/forward policy; do not ad-hoc rollback from smoke operator role.

---

## 10. PR #120 evidence example (security headers)

Reference implementation for issue #114 / #115 after merge to `main`:

| Item | Value |
|------|-------|
| PR | [#120](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/120) |
| Merge commit | `db850f7075b9d344f10f04b9da39f642a640e603` |
| `sha7` | `db850f7` |
| Staging deploy | Success; health confirmed on staging |
| Staging smoke | **PASS** — `SECURITY_HEADERS_BASE_URL=https://staging.aistroyka.ai bash scripts/smoke/security_headers.sh` |
| Production deploy run | [27954493032](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/27954493032) — success |
| Production health | `buildStamp.sha7=db850f7` on apex and www |
| Production canonical smoke | **PASS** — `SECURITY_HEADERS_BASE_URL=https://aistroyka.ai bash scripts/smoke/security_headers.sh` |
| Production www smoke | **PASS** — `SECURITY_HEADERS_BASE_URL=https://www.aistroyka.ai bash scripts/smoke/security_headers.sh` |
| Safety | No deploy performed by smoke task; no live data touched; read-only checks only |

**Evidence comments:**

- Issue #114: https://github.com/2qjckdknjf-ctrl/Aistroyka-web/issues/114#issuecomment-4772784640  
- PR #120: https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/120#issuecomment-4772784849  

---

## Quick operator checklist

- [ ] Expected commit on `origin/main`
- [ ] Staging deploy run success + staging health `buildStamp`
- [ ] Staging read-only smoke PASS (if in scope)
- [ ] Production deploy run success + production health `buildStamp`
- [ ] Explicit production smoke approval recorded
- [ ] Script verified read-only
- [ ] Production smoke PASS (apex; www if required)
- [ ] Evidence posted; no secrets; working tree clean
