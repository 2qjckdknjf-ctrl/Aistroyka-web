# Design system drift — 2026-06-17

**Status:** P1 in progress (post-P0 toolchain + security headers).

## Canonical sources

| Layer | Path |
|-------|------|
| CSS variables | `apps/web/app/design-tokens.css` |
| TS constants | `apps/web/lib/design/design-tokens.ts` |
| Tailwind | `apps/web/tailwind.config.ts` → `aistroyka-*` |
| CTA primitives | `apps/web/app/globals.css` → `.btn-primary`, `.btn-secondary` |

## Closed in this pass

| Item | Change |
|------|--------|
| SSR mobile menu flash | `PublicHeader` — menu closed until user opens (no `!isHydrated \|\| open`) |
| `global-error.tsx` hardcoded colors | Uses `design-tokens.css` CSS variables |

## Remaining (P1 backlog)

| Item | Notes |
|------|-------|
| Legacy `:root` aliases in `globals.css` | `--bg-main`, `--text-muted`, etc. — documented deprecated; migrate `PublicFooter` to `--aistroyka-*` |
| Tailwind duplicate keys | `card` radius vs shadow — keep `aistroyka-card` as canonical |
| Help / dashboard header | audit remaining hardcoded hex outside tokens |
| Visual regression matrix | Playwright screenshots — Phase 2 |

## Supersedes

Older design audits marked **CLOSED** may not reflect current drift; use this file + live UI review as truth for pilot.
