# AISTROYKA — Master Roadmap to 100% Readiness

**Date baseline:** 2026-08-21 (Europe/Madrid)  
**Status:** ACTIVE — supersedes ad-hoc Phase 8 / Product Design pointers for launch sequencing  
**Authoritative SHA (certification baseline):** `a7144249ed0cf1f049cfbdaa9e36e722b1bcfcc8` (`a714424`)  
**Classification:** `production-capable / controlled-pilot candidate` — **not Public GA**

---

## 0. Strategic rule

Every phase follows:

**Inventory → Implement → Validate → Live Verify → Post-Audit → Closure**

- No next phase while meaningful unfinished work remains in the current phase.
- Closure requires explicit verdict: `PROVEN` | `FAILED` | `BLOCKED` | `NOT TESTED` | `DEFERRED BY DECISION`.
- Vague language (`looks good`, `probably works`) is forbidden in closure artifacts.

## 1. Priority sequence

| Phase | Name | Gate |
|-------|------|------|
| 0 | Project Truth Reset | Unambiguous current SHA, deploy SHAs, canonical docs, open PR/issue inventory |
| 1 | Current Main Certification | Web + contracts + iOS + Android green on one SHA |
| 2 | Launch P1 Closure | 0 unresolved technical P1 launch blockers (auth recovery, legal integration, UX regressions) |
| 3 | DB & Security Certification | Migration parity, RLS negative tests, 0 P0/P1 security |
| 4 | Web Product Certification | Critical manager/worker/owner/platform journeys complete without manual DB |
| 5 | iOS Current-Main Certification | TestFlight-ready, technically proven |
| 6 | Android Current-Main Certification | Release AAB ready, distribution path proven |
| 7 | AI Production Certification | Existing AI degrades safely; tenant isolation; observability |
| 8 | External Integrations Certification | Push, email, billing (or explicit DEFERRED_POST_PILOT) |
| 9 | Full Persona E2E | One synthetic construction project end-to-end |
| 10 | Reliability & Operations | SLOs, recovery drills, live observability |
| 11 | Release Candidate Freeze | `v1.0.0-rc.1`; re-certify exact RC SHA |
| 12 | Client Day-0 | Pilot tenant ready without engineering intervention |
| 13 | Controlled Pilot | Evidence-backed fixes only |
| 14 | Pilot Closure | P0/P1 closed; full re-audit |
| 15 | Public GA | Final matrix GREEN → `v1.0.0` |

## 2. Governance (non-negotiable)

1. Do not work directly on `main` — narrow phase branches + PRs.
2. Do not merge broken work or giant mixed-scope PRs.
3. Do not mark production-verified without runtime evidence (`buildStamp`, smoke, E2E).
4. Do not infer DB state from files alone — prove repo ↔ staging ↔ production parity.
5. Do not expose secrets or real pilot PII in repo fixtures.
6. Customer/owner surfaces must never expose internal contractor finance.
7. Prefer additive, backward-compatible migrations; no blind destructive DB repair.

## 3. Deferred until after pilot

Do **not** start merely because branches/code exist:

- Gold Memory production integration
- Expert Review Queue
- AI Flywheel / self-learning pipeline
- SCIM
- Major ERP expansion
- Another full redesign
- Speculative new AI modules

Each requires its own architecture/security/data-governance audit before integration.

## 4. Canonical pointers

| Artifact | Path |
|----------|------|
| Live status (short) | `STATUS.md` |
| Truth index (detailed) | `docs/CURRENT_PROJECT_TRUTH_INDEX.md` |
| Current truth snapshot | `docs/status/AISTROYKA_CURRENT_TRUTH.md` |
| Execution log | `docs/reports/AISTROYKA_100_PERCENT_EXECUTION_LOG.md` |
| Prior 100% plan (reference) | `docs/roadmap/AISTROYKA_100_PERCENT_COMPLETION_PLAN.md` — **HISTORICAL baseline structure; this file is CURRENT for sequencing** |
| Customer-finance roadmap | `docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md` — **CURRENT policy** |
| Phase 8 ops (historical) | `docs/roadmap/AISTROYKA_PHASE8_*` — **HISTORICAL** after 2026-08-21 reset |
| Product design audit | `docs/audit/product-design-current-main-2026-08-09/` — **HISTORICAL evidence**; post-#223–#227 redesign supersedes UI baseline |

## 5. External memory

**Sasha Memory OS:** `MEMORY_WRITE_EXTERNAL_BLOCKER` — MCP server not connected in this environment (2026-08-21).  
Idempotency key reserved: `aistroyka-master-roadmap-100-readiness-2026-08-21-v1`

## 6. Current phase status (2026-08-21)

| Phase | Status | Verdict |
|-------|--------|---------|
| 0 | IN PROGRESS | — |
| 1–15 | NOT STARTED | — |

---

*Updated by: 100% Readiness execution — Phase 0*
