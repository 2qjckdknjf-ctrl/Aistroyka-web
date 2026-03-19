# Phase 3 / A3 — Incident triage — AISTROYKA

**Date:** 2026-03-18  
Companion to `PHASE3_ROLLBACK_RUNBOOK.md` and `PHASE3_RECOVERY_DECISION_MATRIX.md`.

---

## Severity levels

| Level | Examples | Response pace |
|-------|----------|----------------|
| **SEV1** | Production down or major data exposure; all tenants broken | Immediate; page on-call; freeze deploys |
| **SEV2** | Major feature broken; subset of tenants; repeated 5xx | &lt; 30 min to first action |
| **SEV3** | Degraded performance; single-tenant issue; smoke false negative with workaround | Same business day |
| **SEV4** | Staging-only; internal tooling | Best effort |

---

## Decision owner

| Severity | Owner |
|----------|--------|
| SEV1–2 | On-call engineering lead + product/exec as per org chart |
| SEV3 | Release owner or engineer on duty |
| SEV4 | Any engineer with merge rights |

---

## Maximum “wait and see” before action

| Context | Guideline |
|---------|-----------|
| Prod smoke failed after deploy | **Do not wait** — classify within **15 min** (false negative vs real). |
| User reports + green health | Investigate within **30 min**; may be client/cache. |
| Migration apply failed | **No wait** — assume DB state uncertain until verified. |
| Ambiguous blast radius | **30 min** to classify; then execute matrix row H (freeze + escalate). |

---

## When to freeze further deploys

- SEV1 or suspected data loss.  
- Unknown whether DB is consistent after a migration run.  
- Active attack or credential compromise.  
- Two failed production deploys in a row without root-cause.

**Freeze means:** no merges to `main`, no production migration apply, no prod `workflow_dispatch` deploy until lead clears.

---

## When to escalate DB restore / infra owner

- Partial migration or error mid-`db push`.  
- Apparent data corruption or wrong rows across tenants.  
- Need **PITR** or backup restore (Supabase console — see `docs/security/backup-restore.md`).  
- Any doubt about schema state — **escalate before** more `db push`.

---

## Minimal evidence checklist (capture before big actions)

- [ ] UTC time incident observed  
- [ ] Last successful deploy run (link) + commit SHA  
- [ ] Last migration apply run (if any) + target  
- [ ] `/api/v1/health` response (status + snippet, no secrets)  
- [ ] Sample failing request or error message (redacted)  
- [ ] Scope: one tenant vs all  

---

## Quick links

- Rollback steps: `PHASE3_ROLLBACK_RUNBOOK.md`  
- Case logic: `PHASE3_RECOVERY_DECISION_MATRIX.md`  
- Reality check: `PHASE3_ROLLBACK_REALITY_AUDIT.md`  
