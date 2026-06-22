# Next Integration Step Decision — 2026-06-20

## Option A — Continue Backend/API With Another Tiny Slice
- Pros: Keeps scope controlled; backend validation is green.
- Risks: May drift away from the user's main complaint about invisible frontend work.
- Blockers: Need another isolated candidate.
- Recommendation: Not next.

## Option B — Frontend Visibility Audit Against Current Integration Branch
- Pros: Directly addresses the user's core concern that much frontend/design work is not visible.
- Risks: Must remain audit-only first; no broad frontend porting.
- Blockers: Requires route/nav/flag/auth inspection, possibly browser/local app later.
- Recommendation: Recommended next.

## Option C — Start AI Migration Manual Review
- Pros: AI remains a known partial gap.
- Risks: P0 migration/RLS/finance/PII risk; premature without frontend visibility checkpoint.
- Blockers: live DB comparison and migration plan.
- Recommendation: Not now.

## Option D — Start Mobile API Compatibility Audit
- Pros: Mobile remains partial and has pilot branch deltas.
- Risks: Depends on backend/API and frontend/product surface decisions.
- Blockers: mobile build/signing/test context.
- Recommendation: Defer.

## Option E — Prepare Draft PR For Integration Branch Review
- Pros: Makes work reviewable and visible.
- Risks: Branch is docs-heavy and not yet reconciled with frontend visibility issues.
- Blockers: Need decide if more audit first.
- Recommendation: Later, after frontend visibility audit.

## Chosen Next Step
- Option B: Frontend visibility audit against current integration branch.

## Exact Next Step
Run an audit-only comparison of current `origin/main` / integration branch versus `release/web-pilot-rc` and design branches for public/dashboard/owner/client/admin surfaces, route reachability, navigation, auth/role gates, flags, and missing visible UI. Do not port frontend code during that audit.
