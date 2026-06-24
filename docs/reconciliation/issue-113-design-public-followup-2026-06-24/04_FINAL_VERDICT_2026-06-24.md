# Issue #113 Design/Public Follow-Up — Final Verdict

**Date:** 2026-06-24  
**Baseline `main`:** `0d26254bd59282c337b49063db028ff50a2d1e1e`

## Direct answers

| Question | Answer |
|----------|--------|
| **P0 found?** | **No** on current `main` runtime. **P0 merge risk** remains if Liquid Glass / certification branches are broad-merged. |
| **P1 found?** | **Yes** — stale demo-first public CTAs (`Request Demo` family) across EN/RU/ES/IT; hardcoded mock homepage metrics (`MOCK_METRICS`). |
| **Broad design merge safe?** | **NO** — `design/liquid-glass-public-shell-lg2a`, `feature/unified-product-design-certification`, `cursor/aistroyka-system-maturity-7957` remain forbidden. |
| **Deploy needed now?** | **NO** — copy audit only; no runtime change in this PR. |
| **Safe next slice?** | **Public primary CTA copy alignment (i18n-only)** — see `02_SAFE_NEXT_SLICE_2026-06-24.md`. |
| **Issue #113 close now?** | **NO** — keep open until CTA copy slice (or equivalent P1 remediation) merges. |

## Public shell verdict

Current public shell on `main` is **functional and post-baseline safe**:

- Public routes, header, footer, Cabinet CTA, and login paths work.
- Design uses existing AISTROYKA tokens + light public utility classes — **not** Liquid Glass.
- No unsupported GA or 9.5/10 claims in public copy.

Gaps are **copy truth** and **marketing placeholders** (demo CTAs, mock metrics), not structural breakage.

## Liquid Glass verdict

Liquid Glass is **not on `main`**. LG branches are **reference/evidence only**. Broad merge: **unsafe**.

## Final recommendation

1. **Merge this docs-only follow-up audit** (non-author APPROVED + CI).
2. **Implement next PR:** i18n-only public CTA alignment (`en`/`ru`/`es`/`it`) — pilot/contact/presentation wording; no component/CSS changes unless a key split is required.
3. **Defer:** mock metrics removal, LG visual polish, dashboard/public redesign, deploy/smoke.
4. **Do not** broad-merge any design/LG/mobile certification branch.

## Operator sign-off gate

- [ ] Non-author reviewer APPROVED
- [ ] CI PASS
- [ ] No forbidden files in diff
- [ ] Issue #113 updated with PR link
