# GO/NO-GO Council Checklist

## Purpose

Single operator checklist for final publication decision on a release candidate SHA.

## Inputs (must be known before start)

- Candidate commit SHA
- Production deploy run URL
- Staging deploy run URL
- Responsible on-call and rollback owner

## Gate 1: Security and finance isolation

- [ ] `scripts/verify/stakeholder_finance_sanity.sh` passes on target environment with stakeholder user.
- [ ] `docs/security/FINAL_CUSTOMER_FINANCE_ISOLATION_AUDIT.md` updated with latest run evidence.
- [ ] No open P0/P1 in `docs/audit/FINAL_SECURITY_AUDIT.md`.

## Gate 2: Engineering quality

- [ ] PR gate (`CI Check`) green for candidate SHA lineage.
- [ ] `bun run lint`, `bun run test`, `bun run build`, `bun run cf:build` are green in latest release cycle.
- [ ] `bun run release:check` has no FAIL items.

## Gate 3: Runtime validation

- [ ] Production `pilot-smoke` job green.
- [ ] Staging `pilot-smoke` job green.
- [ ] Required pilot E2E subset is green (or approved exception logged).
- [ ] iOS runtime chain evidence attached (worker submit -> manager review -> worker resubmit).

## Gate 4: AI rollout policy

- [ ] AI report reviewed (`docs/publication-readiness/AI_LIVE_PROVIDER_VALIDATION_REPORT.md`).
- [ ] If provider path is still partial, degraded policy is active and reflected in release notes.

## Gate 5: Operations and rollback

- [ ] Rollback owner acknowledges manual rollback path and known-good SHA.
- [ ] First 72h command center checklist is prepared.
- [ ] Incident communication path is configured (Slack/PagerDuty/webhook or equivalent).

## Decision

- [ ] **GO** (all required gates passed)
- [ ] **GO WITH EXCEPTIONS** (explicitly documented and accepted by release owner)
- [ ] **NO-GO** (blockers unresolved)

## Required outputs

- `docs/audit/FINAL_PRODUCTION_READINESS_AUDIT.md` updated with verdict.
- `docs/publication-readiness/FINAL_GO_NO_GO_AUDIT.md` updated with final recommendation.
