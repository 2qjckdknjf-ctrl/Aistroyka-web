# AISTROYKA Design System Inventory

## Scope

- Web token and theme sources
- Shared web UI primitives
- Dashboard shell and auth/public entry surfaces
- Mobile semantic color/theme layers
- Brand and logo docs used as canonical references

## Existing Design Sources

### Web Tokens and Theme Files

- `apps/web/app/design-tokens.css` (primary token map for color, spacing, radius, shadows, typography)
- `apps/web/app/globals.css` (global primitives, utility classes, focus styles)
- `apps/web/lib/design/colors.ts`
- `apps/web/lib/design/spacing.ts`
- `apps/web/lib/design/radius.ts`
- `apps/web/lib/design/shadows.ts`
- `apps/web/lib/design/typography.ts`
- `apps/web/lib/design/design-tokens.ts`
- `apps/web/tailwind.config.ts` (Tailwind alias layer to CSS variables)

### Shared UI Primitives

- `apps/web/components/ui/Button.tsx`
- `apps/web/components/ui/Card.tsx`
- `apps/web/components/ui/Panel.tsx`
- `apps/web/components/ui/Badge.tsx`
- `apps/web/components/ui/Input.tsx`
- `apps/web/components/ui/Select.tsx`
- `apps/web/components/ui/Textarea.tsx`
- `apps/web/components/ui/Tabs.tsx`
- `apps/web/components/ui/Modal.tsx`
- `apps/web/components/ui/Skeleton.tsx`
- `apps/web/components/ui/EmptyState.tsx`
- `apps/web/components/ui/ErrorState.tsx`
- `apps/web/components/ui/StatCard.tsx`
- `apps/web/components/ui/AIInsightCard.tsx`
- `apps/web/components/ui/Icon.tsx`

### Brand and Design Documentation

- `docs/DESIGN_SYSTEM.md`
- `docs/MOBILE_DESIGN_SYSTEM.md`
- `docs/BRAND_ASSETS.md`
- `docs/LOGO_INTEGRATION_REPORT.md`

## Inventory Findings

## 1) Token layer exists and is comprehensive

- Color, spacing, radius, elevation, typography, state, and motion tokens are present.
- Tailwind semantic aliases (`aistroyka-*`) map to CSS variables correctly.
- Shared components predominantly consume tokenized values.

## 2) Duplicate/legacy token naming still coexists

- Legacy variables (`--bg-main`, `--ai-yellow`, `--text-main`) coexist with `--aistroyka-*`.
- This dual naming increases drift risk when one set is changed and the other is not.

## 3) Resolved conflict in canonical accent

- Inconsistent accent value was present in `design-tokens.css` (`#FFC400`) while docs and globals used `#F5C518`.
- Fixed to canonical `#F5C518` for `--ai-yellow` and `--aistroyka-accent`.

## 4) Logo usage baseline

- `Logo` component exists with `full`, `wordmark`, and `icon` variants.
- Public header previously rendered text brand instead of wordmark/logo; fixed to logo variants.

## 5) Public/auth drift

- Public layout and sections had inline gradient styles and one-off CTA styling.
- Auth register page lacked logo while login had it.
- Fixed high-impact drift points to align with shared classes/tokens.

## 6) Dashboard legacy duplication risk (resolved in Stage-2)

- Duplicate dashboard files with ` (1).tsx` suffix (28 files) were identified and removed.
- This reduces parallel-style drift between shadow and active implementations.

## 7) Mobile baseline status

- iOS and Android had functional branding assets, but semantic color usage was partially platform-default in places.
- iOS AccentColor assets were missing explicit color values; fixed to canonical yellow.
- Android apps now include centralized color resources and app-level Compose dark themes aligned to brand.

## Missing or Conflicting Sources

- Conflicting/parallel token namespaces: `--ai-*` and `--aistroyka-*`.
- Residual consistency risk now shifts to long-tail, non-audited feature surfaces and external workspace build blockers.

## Inventory Verdict

- Source of truth is present and usable.
- High-impact brand consistency gaps in public/auth/mobile theme entry points were fixed.
- Remaining drift is concentrated in duplicate file variants and long-tail un-audited screens.
