# Safe Next Slice (2026-06-26)

## Selected slice (exactly ONE)
**Refresh the stale mobile pilot readiness doc to match current `main` — docs-only.**

`docs/release-hardening/MOBILE_PILOT_READINESS.md` currently contains claims that are false on current `main` and could mislead a pilot/deploy decision:
- "Android: **No app in repo**" — **false**: `android/AiStroykaManager`, `android/AiStroykaWorker`, and `android/shared` exist on `main`.
- iOS Worker described as "rename in progress (WorkerLite → AiStroykaWorker)" — the rename is complete on `main` (`ios/AiStroykaWorker` is the app; no WorkerLite app target).
- It predates the iOS UITest smoke (`ios-ui-smoke.yml`) and Layer B E2E (`ios-e2e-integration.yml`) workflows now present.

Correcting this doc is the lowest-risk, highest-truth-value next step: it removes a stale-evidence trap without touching any mobile/web/backend code.

- **Type:** docs-only.
- **Title:** `docs: refresh mobile pilot readiness to current main`.

## Allowed files
- `docs/release-hardening/MOBILE_PILOT_READINESS.md` (rewrite stale claims to current reality)
- optionally a new sibling `docs/reconciliation/issue-112-mobile-fresh-audit-2026-06-26/06_PILOT_READINESS_REFRESH_NOTE_2026-06-26.md` cross-link
- `docs/CURRENT_PROJECT_TRUTH_INDEX.md` — at most a one-line Mobile-row evidence pointer (optional)

## Forbidden files
- `ios/**`, `android/**`, `apps/**`, `packages/**`
- `scripts/**`, `**/migrations/**`, any `.env*`
- `package-lock.json`, deploy config, branch-protection settings
- any Liquid Glass / `release/mobile-pilot-rc` / `cursor/aistroyka-system-maturity-7957` content

## Acceptance criteria
- Readiness doc reflects: iOS Manager + Worker present (rename done); Android Manager/Worker/shared present as Compose scaffold (parity gap noted, iOS-primary); CI smoke + Layer B E2E workflows referenced.
- No new numeric/pilot-live/TestFlight/Play claims; no deployment assumption.
- Diff limited to allowed docs files; full validation suite still PASS (count unchanged 1546/1546).

## Validation commands
```
bun install --frozen-lockfile
bun run lint
bun run build:contracts
bun run i18n:check
I18N_CHECK_ALL=1 bun run i18n:check
bun run test -- --run
bun run build
bun run cf:build
```

## Rollback plan
- Docs-only: revert the single doc commit (`git revert <sha>`), or close the follow-up PR. No runtime/data impact; no mobile code touched.

## Explicitly NOT chosen now (deferred)
- Test-only Android `shared` DTO/contract expansion — viable later (one unit test exists), but defer until the readiness doc is truthful.
- Any iOS/Android build-command execution — requires Xcode/Android SDK; out of this environment.
- Any integration of `release/mobile-pilot-rc` or design branches — remains P0/forbidden per `02_BRANCH_RISK`.
