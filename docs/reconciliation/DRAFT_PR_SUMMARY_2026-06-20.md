# Draft: reconcile AISTROYKA integration baseline

## Summary
This draft PR collects the safe reconciliation baseline after full Git archaeology and branch triage. It does not claim full production readiness.

## 1. What this PR does
- Preserves reconciliation audit evidence.
- Adds safe manager/admin reports CSV backend export.
- Hardens reports export access.
- Locks report review workflow behavior.
- Adds project-scoped dashboard subnavigation.
- Hardens project subnav UX.
- Adds owner/admin project Reports Export UI.
- Documents runtime/browser checkpoint.

## 2. What this PR does NOT do
- Does not merge all historical branches.
- Does not enable AI Flywheel, Gold Memory, or Expert Review runtime.
- Does not apply AI migrations.
- Does not integrate mobile branches.
- Does not expose customer/stakeholder finance.
- Does not implement Liquid Glass redesign.
- Does not deploy to production.

## 3. Validation
- `bun install --frozen-lockfile`: PASS
- `bun run lint`: PASS
- `bun run build:contracts`: PASS
- `bun run i18n:check`: PASS
- `bun run test -- --run`: PASS, 296 test files / 1526 tests
- `bun run build`: PASS
- `bun run cf:build`: PASS

## 4. Runtime status
- Local app reachable.
- Unauthenticated dashboard redirect verified.
- API export runtime verified as owner.
- Authenticated browser dashboard review NOT complete.
- Staging review NOT complete.

## 5. Merge blockers
- Authenticated owner/admin browser dashboard review.
- Staging browser verification.
- Role visibility verification beyond owner API runtime path.
- Frontend smoke script or equivalent manual evidence.
- AI/mobile broader reconciliation deferred.

## 6. Merge recommendation
- Draft PR: YES.
- Ready for main merge: NO.
