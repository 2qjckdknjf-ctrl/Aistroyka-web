# Legacy API Canonicalization Review — 2026-06-20

## Canonical API Surface
- Canonical application API prefix: `/api/v1/*`.
- `packages/contracts-openapi/build-openapi.ts` uses base path `/api/v1`.
- `packages/api-client/src/client.ts` uses `/api/v1`.
- Mobile lite allow-list is scoped to `/api/v1/*` with limited legacy exceptions.

## Legacy Routes Still Active
Current main still contains active legacy or non-v1 routes, including:
- `/api/auth/*` auth routes.
- `/api/health` and `/api/health/auth` health compatibility routes.
- `/api/activation/status`, consumed by onboarding/help components.
- `/api/tenant/*` legacy tenant routes.
- `/api/projects/*` legacy project routes still referenced by older dashboard/media flows per prior docs.
- `/api/webhooks/incoming` re-export route.

## Consumers Still Using Legacy Routes
Read-only search found legacy `/api/*` consumers, including:
- `components/onboarding/LaunchConfidenceBanner.tsx` -> `/api/activation/status`
- `components/onboarding/GetStartedPanel.tsx` -> `/api/activation/status`
- `components/onboarding/FirstValueBanner.tsx` -> `/api/activation/status`
- `components/help/HelpStartChecklist.tsx` -> `/api/activation/status`
- `components/help/AIGuidePanel.tsx` -> `/api/activation/status`
- E2E helper login uses `/api/auth/login`

These are not necessarily bugs: auth and some compatibility routes may intentionally remain legacy.

## Branches Changing Legacy / v1 Behavior
- `chore/phase13-operator-refresh`
  - changes `/api/tenant/members` from a full legacy implementation to a redirect via `redirectToV1PreservePath`.
- `release/publication-readiness-mega-sprint`
  - older branch with broad legacy API inventory/redirect work, mostly stale and already represented by docs/main migrations.

## Risk Of Breaking Frontend / Mobile
- High if legacy tenant routes are redirected without checking current callers.
- Medium if `/api/activation/status` is canonicalized while onboarding/help components still call the legacy path.
- Low for `/api/auth/*` because auth routes are explicitly outside `/api/v1` convention.
- Mobile lite clients should continue to prefer `/api/v1/*`; do not add new mobile dependencies on legacy paths.

## Recommended Canonicalization Plan
1. Inventory all legacy route consumers by runtime surface.
2. Keep `/api/auth/*` as auth-specific non-v1 surface.
3. For each legacy route, choose one:
   - keep as intentional compatibility route
   - redirect to `/api/v1/*`
   - re-export v1 handler
   - migrate callers first, then deprecate
4. Add/keep deprecation headers for compatibility routes where appropriate.
5. Only then modify legacy route implementations.

## What Not To Touch Yet
- Do not redirect `/api/tenant/members` yet.
- Do not remove `/api/activation/status` while frontend consumers still call it.
- Do not alter `/api/auth/*`.
- Do not rewrite middleware matchers as part of legacy canonicalization.

## Decision
- Canonical surface: `/api/v1/*`, with intentional exceptions.
- Decision: `manual_review_again`.
- Backend/API implementation should first migrate or confirm consumers, then canonicalize one route family at a time.
