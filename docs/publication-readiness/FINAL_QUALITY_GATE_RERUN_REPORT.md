# Final Quality Gate Rerun Report

## Goal

Re-run strongest available repository and platform gate after final-stage updates.

## Command matrix

| Command | Result | Notes |
|---|---|---|
| `bun install` | PASS | Dependencies resolved and postinstall check passed. |
| `bun run typecheck` | UNAVAILABLE | Root script `typecheck` is not defined in `package.json`. |
| `bun run lint` | PASS | No ESLint warnings/errors. |
| `bun run test` | PASS | `274` files / `1446` tests passed. |
| `bun run build` | PASS | Contracts + Next build succeeded. |
| `bun run cf:build` | PASS | OpenNext Cloudflare bundle succeeded. |
| `bun run release:check` | PASS_WITH_WARNINGS | Optional integrations remain unset in local env. |
| `NODE_ENV=production node scripts/validate-release-env.mjs` | PASS_WITH_WARNINGS | Optional keys not set (AI/Stripe/etc). |
| `bash -n scripts/smoke/pilot_launch.sh` + `bash -n scripts/smoke/check_pilot_prereqs.sh` | PASS | Smoke scripts syntax-valid. |
| `bun run smoke:pilot:check --strict` | FAIL (ENV) | Missing local runtime env/credentials in this shell. |
| `supabase migration list` | FAIL (EXTERNAL) | 401 unauthorized / missing DB login role password path. |
| `xcodebuild ... AiStroykaWorker ... build` | PASS | iOS Worker build successful. |
| `xcodebuild ... AiStroykaManager ... build` | PASS | iOS Manager build successful. |
| `./gradlew :AiStroykaWorker:assembleDebug :AiStroykaManager:assembleDebug` | PASS | Android debug builds successful (AGP warning persists). |

## Interpretation

1. Repository quality gate is strong and passing for code/build/tests.
2. Remaining failures are environment/external credential blockers, not repo compile/test regressions.
3. Strict smoke runtime has independent passing evidence in production deploy workflow, while local strict precheck remains env-dependent.

## Latest rerun (live-closure pass)

Executed in this pass:

- `bun run typecheck` -> `UNAVAILABLE` (`Script not found "typecheck"` in root `package.json`)
- `bun run lint` -> PASS
- `bun run test` -> PASS (`274` files / `1446` tests)
- `bun run build` -> PASS
- `bun run cf:build` -> PASS
- `bun run smoke:pilot:check --strict` -> FAIL (ENV: missing `BASE_URL`, auth path, E2E creds, `SUPABASE_ACCESS_TOKEN`)

Conclusion remains unchanged: repo gate passes; strict local smoke and Supabase-linked checks are environment-dependent.

## Latest rerun (max continuation pass)

Executed in this pass:

- `bun run test` -> PASS (`274` files / `1447` tests, `exit_code: 0`)
- `bun run build` -> PASS (`Compiled successfully`, `exit_code: 0`)
- `bun run cf:build` -> PASS (`OpenNext build complete`, `exit_code: 0`)

Interpretation:

1. Repository gate remains green after AI routing/deploy hardening updates.
2. No new compile/test regressions introduced by latest live-closure changes.
3. Remaining blockers stay external/runtime-evidence class (P1 iOS full transaction, P1 AI non-fallback provider path).

## Verdict

**PASS_WITH_EXTERNAL_BLOCKERS**

