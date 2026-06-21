# Post-Baseline Tail Plan

Date: 2026-06-21
Branch: `audit/final-global-premerge-audit-2026-06-21`
Related baseline PR: #109

## Current Gate

PR #109 is the approved reconciliation baseline candidate, but it remains unmerged until a separate authorized reviewer/admin satisfies the protected-branch approving-review requirement.

No branch protection bypass, forced merge, manual production deploy, or PR #109 branch mutation is approved.

## Execution Rule

Do not start these tails on top of PR #109 until the baseline is merged to `main` and post-merge validation has completed.

Each tail must be a separate PR with its own:

- scope statement
- implementation or audit plan
- tenant/project authorization review
- customer finance isolation review
- focused tests
- full validation
- explicit YES/NO closure verdict

## Tail 1: AI / Flywheel / Gold Memory / Expert Review Queue

Goal: decide whether AI learning, gold memory, expert review queue, and flywheel code should be integrated, rewritten, or deferred.

Required gates:

- audit schema and RLS assumptions before applying or relying on migrations
- verify server-side tenant isolation for all AI training/review data
- prove no customer/owner surface can access internal AI finance risk, margins, costs, or training artifacts
- require live-provider proof before any LIVE/LEVEL 4 claim
- keep fallback behavior explicitly labeled

Initial outcome target: audit-only PR first, implementation PR only after a YES verdict.

## Tail 2: Mobile Pilot / iOS / Android Follow-Ups

Goal: reconcile mobile pilot readiness without merging Manager and Worker apps or expanding Android before iOS is product-ready.

Required gates:

- preserve iOS Manager and Worker separation
- validate mobile API allow-list behavior for lite clients
- run relevant iOS smoke/E2E workflows or document simulator/runtime blockers
- verify report/task/sync behavior against canonical `/api/v1/*`
- do not introduce mobile-specific backend modules unless required by audited gaps

Initial outcome target: iOS-first pilot audit PR, Android parity deferred unless explicitly approved.

## Tail 3: Liquid Glass / Public Redesign

Goal: evaluate the external design/redesign work as a contained visibility slice, not a broad replacement.

Required gates:

- compare routed public pages against current production truth
- preserve cabinet/dashboard entry visibility
- keep dashboard/auth/tenant flows stable
- update `en`, `ru`, `es`, and `it` copy together for user-visible strings
- run `bun run i18n:check` after copy changes

Initial outcome target: design inventory and one minimal public UI slice plan.

## Tail 4: Middleware / Security Follow-Up Review

Goal: close security tails not included in PR #109 without destabilizing middleware or tenant logic.

Required gates:

- audit `middleware.ts`, lite allow-list, auth redirects, dashboard access, and public/customer route boundaries
- prove customer/owner routes cannot expose internal costs, margins, budget pressure, or contractor costs
- verify security headers through the canonical middleware/header source
- avoid broad RBAC redesign unless a concrete blocker requires it

Initial outcome target: security review PR with fixes only for confirmed issues.

## Tail 5: Live / Staging Smoke Policy

Goal: define operator-gated smoke rules after the reconciliation baseline lands.

Required gates:

- separate local, preview, staging, and production evidence
- avoid fake success claims from fallback AI responses
- require non-fallback AI proof before live AI claims
- define when smoke data may be created and how it must be cleaned up
- document platform-auth blockers honestly

Initial outcome target: runbook/policy PR before any new release smoke automation.

## Tail 6: Stale Branch Archival Cleanup

Goal: reduce future reconciliation risk without deleting useful evidence.

Required gates:

- classify stale branches by merged, superseded, dangerous, or evidence-only
- avoid deleting branches without explicit operator approval
- keep branch matrices linked to audit evidence
- preserve release/audit provenance

Initial outcome target: branch archival recommendation doc, no deletion.

## Tail 7: Docs Truth Cleanup

Goal: align docs with the post-baseline code state after PR #109 merges.

Required gates:

- distinguish shipped baseline from deferred tails
- update any PR #109 blocker text after the required approval/merge completes
- avoid marking AI/mobile/design tails complete
- preserve customer-finance isolation warnings in docs touching owner/customer surfaces

Initial outcome target: docs-only cleanup PR after baseline merge and validation.

## Final Verdict

Post-baseline tail plan status: YES, prepared.

Safe to execute before PR #109 merges: NO.

Next exact step: obtain separate authorized reviewer/admin approval for PR #109, merge it through the protected GitHub path, validate `main`, then open the first tail as an audit-only PR.
