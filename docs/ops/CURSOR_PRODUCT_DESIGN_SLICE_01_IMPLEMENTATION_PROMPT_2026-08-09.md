# Cursor Prompt — Product Design Remediation Slice 01 Implementation

**Date:** 2026-08-09

**Canonical name:** **Product Design Remediation Slice 01**

**Not the same as:** historical **Liquid Glass Slice 1** (public design foundation — already implemented).

**Derived from:** `docs/audit/product-design-current-main-2026-08-09/` (verdict `PRODUCT_DESIGN_AUDIT_PARTIAL_BLOCKED_EXTERNAL`)

**Canonical source baseline:** `origin/main` @ `02baa6a379ca9ff30735d35e53aea5198e972d45` (verify at start; re-verify after audit docs merge)

**Authorizations (default for the implementation session):**

`IMPLEMENTATION_AUTHORIZATION=NOT_GRANTED`

`COMMIT_AUTHORIZATION=NOT_GRANTED`

`PUSH_AUTHORIZATION=NOT_GRANTED`

`PR_AUTHORIZATION=NOT_GRANTED`

`DRAFT_PR_AUTHORIZATION=NOT_GRANTED`

`MERGE_AUTHORIZATION=NOT_GRANTED`

`DEPLOY_AUTHORIZATION=NOT_GRANTED`

`PRODUCTION_AUTHORIZATION=NOT_GRANTED`

`MIGRATION_AUTHORIZATION=NOT_GRANTED`

`EXTERNAL_MUTATION_AUTHORIZATION=NOT_GRANTED`

`LIVE_AI_AUTHORIZATION=NOT_GRANTED`

This handoff publishes the audit only. Do **not** start **Product Design Remediation Slice 01** implementation until a later owner prompt sets `IMPLEMENTATION_AUTHORIZATION=GRANTED` (and any commit/PR gates separately). This remediation slice is **not** already completed.

---

## Copy into Cursor Agent mode

```text
You are implementing Product Design Remediation Slice 01 for AISTROYKA
(not Liquid Glass Slice 1; not a completed Wave C claim).

PRIMARY WORKSPACE
/Users/alex/Projects/AISTROYKA

OBJECTIVE
Fix the smallest coherent evidence-backed P0/P1 visual/UX slice from the 2026-08-09 Product Design audit without broad design-branch merges and without touching legal copy (unless counsel-ready text is explicitly provided).

AUDIT SOURCE (read completely)
- docs/audit/product-design-current-main-2026-08-09/00_CURRENT_BASELINE.md
- docs/audit/product-design-current-main-2026-08-09/02_FLOW_STEP_AUDIT.md
- docs/audit/product-design-current-main-2026-08-09/06_PRIORITIZED_BACKLOG.csv
- docs/audit/product-design-current-main-2026-08-09/07_FINAL_PRODUCT_DESIGN_AUDIT.md
- AGENTS.md
- docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md

IN SCOPE (Product Design Remediation Slice 01 only)
1) PD-P1-01 — Remove production-visible login debug status ("Login step: idle") from /[locale]/login for EN/RU/ES/IT.
2) PD-P1-03 — First-run `FirstLaunchGuide` Modal accessibility: add Escape-to-close, focus trap, and initial/restore focus. Dismissal persistence already exists (`localStorage` key `aistroyka:first-launch-guide:v1` read on mount / written in `closeGuide`) — do NOT reimplement persistence or treat the intended first-run overlay itself as a defect.
3) PD-P2-01 / PD-P2-02 — Make `bun run --cwd apps/web check:design` PASS by replacing raw Tailwind red-600/green-600 in:
   - apps/web/components/dashboard/TaskChatPanel.tsx
   - apps/web/components/help/HelpStartChecklist.tsx
   with aistroyka semantic error/success classes/tokens.

OPTIONAL ONLY IF STILL TINY AFTER ABOVE (same PR, else defer)
4) PD-P1-04 reduced: document-only OR a minimal aria-current / label clarification on project tabs — do NOT redesign the whole project hub unless the three items above are already green and the change stays under a small file set.

OUT OF SCOPE (explicit exclusions)
- Privacy/Terms legal rewrite (PD-P1-02) unless owner provides final counsel copy in the prompt follow-up.
- Client portal shell rewrite (PD-P1-05).
- Password reset route (PD-P1-06).
- Broad Liquid Glass merges from design/* branches (do not conflate with this remediation slice).
- iOS/Android feature work.
- Platform-admin / ROMA changes.
- AI LIVE calls, push, billing, migrations, store upload.
- Rewriting historical audits or silently closing R0.2/R0.3/R1/R2/R3.
- Customer-finance surfaces: do not expose costs/margin/profitability on portal/client/owner views.

WORKTREE RULES
- Preserve dirty primary worktree; never reset/revert/stash user work.
- Create an isolated worktree/branch from current origin/main (verify SHA first).
- Prefer /Users/alex/Projects/AISTROYKA-main-clean only if it is clean and exactly at current origin/main; otherwise new temp worktree.
- Branch name suggestion: design/product-design-remediation-slice-01-2026-08-09

IMPLEMENTATION CONSTRAINTS
- Prefer isolated component/helper fixes over refactors.
- Keep tenant/RBAC/active-tenant behavior unchanged.
- If copy keys change, update en/ru/es/it together and run bun run i18n:check.
- No secrets in commits.
- Default commit/push/PR/deploy = NOT_GRANTED unless user explicitly sets *_AUTHORIZATION=GRANTED.

VALIDATION (required)
1. bun run --cwd apps/web check:design → PASS
2. Web lint for touched paths (repo ESLint CLI / `bun run` lint script used by CI) → PASS
3. TypeScript / typecheck for apps/web as used in CI (or equivalent `tsc --noEmit` path) → PASS
4. Targeted unit/component tests for FirstLaunchGuide/Modal Escape + focus trap and login UI (do not re-test inventing persistence)
5. `bun run i18n:check` → PASS when messages touched; EN/RU/ES/IT parity required for any copy change
6. Visual regression evidence: BEFORE/AFTER screenshots on staging or local current-main:
   - `/en/login` and `/ru/login` (desktop + mobile) — no "Login step" debug text
   - `/en/dashboard` first-run modal keyboard: Escape closes; focus trapped while open
7. Bounded keyboard check: Tab to Sign in; focus visible; Escape closes first-run modal when open
8. Prefer `bun run --cwd apps/web build` or CI-equivalent build proof for touched web surfaces when practical
9. `git diff --check`
10. Do not claim WCAG compliance

ACCEPTANCE CRITERIA
- Login screens EN/RU/ES/IT show no debug step string in production build.
- First-run modal: Escape closes; focus trap/initial focus work; existing `aistroyka:first-launch-guide:v1` persistence behavior remains unchanged (do not reimplement).
- check:design, lint, and typecheck are green for the slice.
- No customer-finance leakage introduced.
- Closure note with files changed, checks, YES/NO.

ROLLBACK
- Close Draft PR and/or revert the docs/code commit on the slice branch; no migration expected.
- Keep using existing namespaced persistence key `aistroyka:first-launch-guide:v1` (do not invent a second key).

STOP CONDITIONS
- If `IMPLEMENTATION_AUTHORIZATION` is not `GRANTED`, do not implement.
- If origin/main ≠ expected baseline and drift is unclear, stop and re-baseline.
- If fix requires portal RBAC redesign, legal copy, platform-owner, client persona, or production mutation credentials, stop and split a new slice.
- Do not mark Ready / merge the implementation PR unless separately authorized.
- Do **not** manually promote production or trigger application-code production deployment.
- CI may still run lint/tests/`cf:build` (Cloudflare bundle) and automatic preview deployments on the Draft PR; that is not a manual production promotion. Do not cancel or alter those workflows.
- Do not apply migrations. Do not mutate production/staging data.
- When implementation is authorized later: open at most a **Draft PR**, then stop.

FINAL RESPONSE FORMAT
Product Design Remediation Slice 01 verdict YES/NO:
Files changed:
Checks run + results:
Screenshots paths:
Commit/push/PR: NOT_GRANTED | GRANTED+urls
Remaining tails:
Exact next action:
```

---

## Expected boundary

**Product Design Remediation Slice 01** is a **small UX/token hygiene** candidate covering **PD-P1-01, PD-P1-03, PD-P2-01, PD-P2-02** only (optional tiny PD-P1-04 label polish).

It is distinct from already-implemented historical **Liquid Glass Slice 1** (public design foundation).

It does **not** close the other 13 backlog items, R1 legal, Wave C, blocked external flows, or Client Day 0.

Current handoff keeps `IMPLEMENTATION_AUTHORIZATION=NOT_GRANTED` and does **not** claim this remediation slice complete.
