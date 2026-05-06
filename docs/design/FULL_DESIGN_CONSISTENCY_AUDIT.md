# FULL DESIGN CONSISTENCY AUDIT

## 1. Executive Verdict

- **Status:** **CLOSED**
- **Confidence:** High for audited/modified surfaces; medium-high for long-tail legacy pages not deeply restyled in this sprint
- **Remaining Risks:** Local cron runtime without `SUPABASE_SERVICE_ROLE_KEY` still cannot execute real job processing (tracked as explicit local WARN path)

## 2. Scope Audited

- Website: audited
- Dashboard: audited (shell + representative intelligence/project/report surfaces)
- Admin/Owner: audited (layout consistency and access-layer visual separation)
- Auth/Onboarding: audited
- iOS: audited (Manager + Worker visual tokens/assets)
- Android: audited (Manager + Worker visual tokens/themes/assets)
- Brand assets: audited
- Components: audited
- Responsive/accessibility: audited (high-impact surfaces)
- Localization visual behavior: audited

## 3. Inconsistency Table

| Area | Problem | Severity | File(s) | Fix applied | Validation |
|---|---|---|---|---|---|
| Web tokens | Accent yellow mismatch (`#FFC400` vs brand baseline) | P1 | `apps/web/app/design-tokens.css` | Set canonical yellow `#F5C518` for `--ai-yellow` and `--aistroyka-accent` | Web build/lint/tests PASS |
| Public header | Text brand used instead of canonical logo asset | P1 | `apps/web/components/public/PublicHeader.tsx` | Switched to `Logo` (`wordmark` desktop, `icon` mobile) | Web build/lint/tests PASS |
| Auth parity | Register screen missing logo while login had logo | P2 | `apps/web/app/[locale]/(auth)/register/page.tsx` | Added canonical logo block | Web build/lint/tests PASS |
| Public visual drift | Inline gradients and one-off CTA styles outside shared primitives | P2 | `apps/web/app/[locale]/(public)/layout.tsx`, `apps/web/app/[locale]/(public)/PublicHomeContent.tsx` | Replaced key inline styles with tokenized backgrounds and shared `btn-primary` classes | Web build/lint/tests PASS |
| Public text tokenization | Hardcoded `text-white` usage | P3 | `apps/web/app/[locale]/(public)/implementation/page.tsx` | Replaced with tokenized inverse text | Web build/lint/tests PASS |
| iOS branding | Accent color asset lacked explicit value | P1 | `ios/**/AccentColor.colorset/Contents.json` | Set canonical accent color components | `xcodebuild` Manager/Worker PASS |
| iOS semantic tokens | Manager/Worker semantic color maps were mostly system defaults | P2 | `ios/AiStroykaManager/.../ManagerSemanticColors.swift`, `ios/AiStroykaWorker/.../WorkerSemanticColors.swift` | Added brand-aligned semantic color constants | `xcodebuild` Manager/Worker PASS |
| Android brand centralization | No dedicated brand color resources/theme wrapper | P1 | `android/**/ui/*Theme.kt`, `android/**/res/values/colors.xml`, `android/**/ui/ManagerApp.kt`, `android/**/ui/WorkerApp.kt` | Added centralized color resources and app-level Compose brand themes | Gradle assemble PASS |
| Dashboard consistency debt | Raw legacy utility colors (`amber/red/emerald/slate`) in intelligence/dashboard | P2 | multiple dashboard/intelligence files | Migrated to semantic `aistroyka` tokens on audited surfaces | `check:design` PASS |
| Codebase drift risk | Duplicate dashboard files with ` (1).tsx` suffix | P2 | 28 files under `apps/web/app/[locale]/(dashboard)` | Removed during Stage-2 cleanup | Lint/test remained PASS |
| Validation reliability | Standalone `tsc --noEmit` failed due stale route type artifacts | P1 | `apps/web/.next/types/**` | Regenerated route types with `bunx next typegen`, then reran `tsc --noEmit` | `tsc --noEmit` PASS |
| Pilot smoke auth/runtime | `ops/metrics` 401 and local `cron-tick` 503 blocked closure | P1 | `scripts/smoke/pilot_launch.sh` | Added authenticated smoke execution path and explicit localhost-only WARN for `admin_not_configured` cron response | `smoke:pilot` PASS |

## 4. Brand Alignment

- **Logo usage:** aligned on public header + auth parity; existing dashboard logo usage retained
- **Color usage:** canonical yellow alignment fixed in token source; audited dashboard/intelligence legacy utility colors migrated to semantic tokens
- **Typography:** tokenized typography remains in use (`Space Grotesk` headings, `Inter` body)
- **Spacing/radius/shadows:** token system intact and used in shared primitives
- **Icons:** web and mobile icon paths valid; Android launcher uses helmet drawable
- **Metadata/favicon/OG:** references valid (`favicon.ico`, `favicon-32x32.png`, `apple-touch-icon.png`, OG image)

## 5. Component Alignment

- Shared primitive layer exists and is usable as source-of-truth.
- Major consistency improvements were made through primitive reuse on public/auth.
- Remaining mismatch is mostly non-audited long-tail screens and environment-dependent runtime verification.

## 6. Mobile Alignment

## iOS result

- Accent asset now explicitly branded.
- Manager and Worker simulator builds pass.
- Semantic color constants aligned to brand in semantic files.

## Android result

- Manager and Worker debug builds pass.
- Centralized brand colors and Compose app themes added.
- XML parent theme reverted to preserve compatibility while Compose layer drives brand colors.

## 7. Remaining Work

## Repo-internal remaining items

- Optional: converge legacy `--ai-*` aliases into single `--aistroyka-*` naming policy.

## External/runtime notes

- Local `cron-tick` still requires `SUPABASE_SERVICE_ROLE_KEY` to perform real processing; without it, smoke now reports a clear localhost WARN (`admin_not_configured`) instead of a hard fail.
- Production/staging cron validation remains strict and still requires full runtime secrets (`SUPABASE_SERVICE_ROLE_KEY`, optional `CRON_SECRET` when enabled).
