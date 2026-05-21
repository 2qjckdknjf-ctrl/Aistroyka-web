# Release War Room Baseline (2026-05)

## Scope lock

- Release contour: **Web + iOS** for controlled rollout, Android stays **deferred** until separate readiness closure.
- Strategic verdict source: `docs/publication-readiness/FINAL_GO_NO_GO_AUDIT.md`.
- Master stage ledger source: `docs/publication-readiness/MASTER_PUBLICATION_READINESS_STATUS.md`.
- Security invariant: customer/owner must never see internal company financial state.

## Frozen P1 blockers

1. **Stakeholder live sanity**: `/api/v1/portal/projects` live proof + `scripts/verify/stakeholder_finance_sanity.sh` evidence.
2. **iOS full runtime chain**: worker submit -> manager review -> worker resubmit proof (not only login smoke).
3. **AI provider-backed path**: remove `provider_unavailable` dependency for non-fallback success, or explicitly ship degraded policy.

## Frozen P2 blockers

1. **Rollback automation**: still manual revert/redeploy, no automatic post-smoke rollback.
2. **Migration workflow parity**: no canonical CI migration apply workflow; operator-only CLI path.
3. **Alert transport**: health/log signals exist, but escalation transport is external and must be operator-wired.
4. **Android production readiness**: deferred track requires separate CI/runtime hardening.

## Workstream owners (to be assigned in war room kickoff)

| Workstream | Deliverable | Owner |
|---|---|---|
| Security + finance isolation | Final live PASS proof + updated security audits | TBD |
| Web GA hardening | Updated release gates + synchronized runbooks | TBD |
| iOS readiness | Closed runtime/TestFlight checklist with evidence pack | TBD |
| Android deferred track | Explicit policy + execution backlog | TBD |
| AI policy | Provider-backed closure or degraded rollout policy | TBD |
| Ops and release council | Go/no-go checklist + first-72h command center | TBD |

## Exit criteria

- No open P0/P1 blockers.
- Release council checklist is PASS on the latest production candidate SHA.
- Security and finance isolation verdict remains YES after final live replay.
