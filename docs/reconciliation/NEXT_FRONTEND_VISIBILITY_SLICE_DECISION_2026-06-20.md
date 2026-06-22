# Next Frontend Visibility Slice Decision — 2026-06-20

## Option A — Reports Export UI Entry Point
- Value: high and tightly scoped; backend route is implemented and hardened.
- Risk: low/moderate; must be owner/admin-only and avoid customer/stakeholder exposure.
- Dependencies: existing `/api/v1/reports/export`.
- Tests needed: button/link visible only to owner/admin, hidden from worker/stakeholder; CSV endpoint invocation not required in UI test.
- Why now: Smallest controlled visibility improvement after project subnav review.
- Recommendation: Recommended next.

## Option B — Public/Brand Baseline Planning From `release/web-pilot-rc`
- Value: high for public perception.
- Risk: moderate/high due broad design/messages surface.
- Dependencies: design review.
- Tests needed: public route/header/i18n/build.
- Recommendation: Later.

## Option C — Dashboard Nav Cleanup For Hidden Existing Routes
- Value: medium.
- Risk: medium; top-level clutter and unsafe role exposure.
- Dependencies: role matrix.
- Tests needed: nav gating.
- Recommendation: Later after project subnav and export UI.

## Option D — Frontend Smoke Script Planning
- Value: medium; improves validation.
- Risk: low.
- Dependencies: test infra decisions.
- Tests needed: script itself.
- Recommendation: Useful, but not product visibility.

## Option E — Pause Frontend And Return To AI Migration Manual Review
- Value: high for AI roadmap.
- Risk: P0.
- Dependencies: DB/RLS/live schema review.
- Recommendation: Not now.

## Recommended Next Slice
- Option A: Reports export UI entry point, manager/admin only.

## Constraints
- No customer/stakeholder export.
- No finance fields.
- No mobile.
- No AI.
- No public redesign.
