# Phase 3 / A3 — Recovery decision matrix — AISTROYKA

**Date:** 2026-03-18  
Use with `PHASE3_ROLLBACK_RUNBOOK.md` and `PHASE3_INCIDENT_TRIAGE.md`.

---

## A. Deploy workflow failed **before** production/staging deploy completed

| | |
|--|--|
| **Blast radius** | Usually none on edge; no new worker or incomplete deploy. |
| **First action** | Read failing job logs; fix build/secrets/checkout; re-run workflow or push fix. |
| **Rollback web** | Not needed — previous worker still serving (if deploy step did not finish successfully). |
| **Fix-forward** | Yes — correct the failure and redeploy. |
| **DB restore** | No — unrelated unless you were also running migrations separately. |
| **Decider** | Release owner / on-call engineer. |
| **Evidence** | GitHub Actions run URL, failed step name, commit SHA. |

---

## B. Deploy succeeded, automatic smoke failed

| | |
|--|--|
| **Blast radius** | **New worker is live**; users may already see new behavior. Smoke may be config (JWT, cron) vs real breakage. |
| **First action** | Classify: rerun `pilot_launch.sh` locally against same `BASE_URL`; check `/api/v1/health` manually. |
| **Rollback web** | **Yes if** real regression — revert + push or `workflow_dispatch` with `ref` = last good SHA. |
| **Fix-forward** | **Yes if** smoke false negative (expired JWT, missing `CRON_SECRET`) — fix secrets, optional empty commit to re-run. |
| **DB restore** | Only if symptoms indicate data/schema corruption (rare from smoke alone). |
| **Decider** | Release owner; escalate if customer-visible outage. |
| **Evidence** | Smoke log output, workflow run, time of deploy, `NEXT_PUBLIC_BUILD_SHA` in responses if exposed. |

---

## C. Production app broken, **DB was not changed**

| | |
|--|--|
| **Blast radius** | Edge/runtime only (500s, wrong config, middleware). |
| **First action** | Confirm no migration ran since last good state. |
| **Rollback web** | **Primary** — redeploy known-good commit (revert or dispatch `ref`). |
| **Fix-forward** | Alternative if small hotfix is faster than revert. |
| **DB restore** | No. |
| **Decider** | Release owner. |
| **Evidence** | Error logs, Cloudflare Workers logs, health endpoint body. |

---

## D. Migration apply **failed before** DB mutation completed

| | |
|--|--|
| **Blast radius** | Ideally none if failure was before/during `db push` and transaction rolled back — **verify in Supabase**. |
| **First action** | Do not re-run blindly; read workflow logs; check `migration list` vs DB. |
| **Rollback web** | Only if you deployed app expecting new schema — align web version with DB. |
| **Fix-forward** | Fix migration files or history per A1 runbook; then controlled re-apply. |
| **DB restore** | Only if partial apply left inconsistent state (escalate). |
| **Decider** | Engineer + DBA judgment; use environment protection on production. |
| **Evidence** | Apply workflow run, Supabase migration history, error text. |

---

## E. Migration **partially** changed DB or **schema drift**

| | |
|--|--|
| **Blast radius** | High — app queries may 500; data may be wrong. |
| **First action** | **Stop** further applies; snapshot mental model + console inspection. |
| **Rollback web** | May need to **roll web back** to match old schema **or** ship fix-forward migration — choose one coherent path. |
| **Fix-forward** | Preferred when safe: corrective migration + deploy matching code. |
| **DB restore / escalation** | If fix-forward unsafe or data corrupted → **Supabase PITR / backup** with infra owner (see `docs/security/backup-restore.md`). |
| **Decider** | Senior engineer + infra/DB owner; not junior solo. |
| **Evidence** | Exact migration version applied, DDL diff, sample failing query, time window. |

---

## F. Secrets / config error caused bad release

| | |
|--|--|
| **Blast radius** | Misconfigured worker (wrong env vars), auth/cron failures. |
| **First action** | Identify which secret (Cloudflare env, GitHub, Supabase dashboard). |
| **Rollback web** | Optional if code is fine — may fix by correcting secrets + redeploy same commit. |
| **Fix-forward** | **Common path** — fix secrets, trigger redeploy. |
| **DB restore** | No unless bad writes occurred. |
| **Decider** | Release owner + whoever owns secrets. |
| **Evidence** | Which deploy introduced change; secret rotation audit (no values in tickets). |

---

## G. Tenant / auth incident after deploy

| | |
|--|--|
| **Blast radius** | One tenant vs all tenants; session/JWT/RLS. |
| **First action** | Reproduce as affected tenant vs admin; check Supabase Auth + RLS policies (if migration touched them, link to case E). |
| **Rollback web** | If regression from this release — same as C. |
| **Fix-forward** | Hotfix or policy correction if isolated. |
| **DB restore** | Rare; only if mass data corruption. |
| **Decider** | Product + engineering; security if breach suspected. |
| **Evidence** | Tenant IDs, request IDs, auth error codes, recent migrations touching auth tables. |

---

## H. Unknown incident / ambiguous blast radius

| | |
|--|--|
| **Blast radius** | Unknown. |
| **First action** | **Freeze deploys** (see triage doc); gather health + logs + last deploy + last migration time. |
| **Rollback web** | Consider timeboxed decision: if no clarity in **30 min**, bias to **revert web** to last known-good if deploy happened recently. |
| **Fix-forward** | Only after classification. |
| **DB restore** | Escalate to infra owner; do not guess. |
| **Decider** | On-call lead + escalation path. |
| **Evidence** | Timeline, all workflow runs in window, user reports, error rate. |
