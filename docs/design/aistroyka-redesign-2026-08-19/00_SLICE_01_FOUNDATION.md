# AISTROYKA Redesign — Slice 01 Foundation

**Date:** 2026-08-19  
**Canonical Memory OS record:** `56263de1-d0a9-48b6-8275-e40df7391f5a`  
**Title:** AISTROYKA Redesign — FINAL CANONICAL DESIGN SYSTEM & RESPONSIVE ARCHITECTURE — 2026-08-19  
**Base:** `origin/main` @ `7c6ff21fe1aedbd7708cebff3c6cde682fc851ff`  
**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`

This slice starts implementation of the Memory OS canonical redesign. It does **not** rebuild product logic, routes, RBAC, or APIs.

## Audit gaps closed

1. `--lg-*` CSS roots were referenced by `styles/liquid-glass.css` and public chrome but **not defined** in `design-tokens.css`.
2. Cabinet shell used opaque `bg-aistroyka-surface` instead of Liquid Glass nav material.
3. Dashboard overview hero was a flat branded block, not a hero-intensity glass surface.
4. Intelligence spectrum tokens (live cyan / AI violet) were missing; construction-yellow remains the primary action color.

## In scope

- Liquid Glass `:root` tokens + motion/intelligence tokens
- Dashboard shell rail + topbar glass chrome
- Dashboard overview hero glass
- Root-token unit test

## Out of scope (later slices)

- Full IA regroup (Overview…More) and removal of duplicate project tabs
- Remaining canonical surfaces B–J
- Owner/client portal rewrite
- iOS/Android visual migration
- Render PNG persistence (`design/aistroyka-canonical-render-pack-2026-08-16` is docs-only; binaries still unverified)
- Commit / push / merge / deploy (not authorized in this session unless owner asks)

## Validation

- `bun run --cwd apps/web check:design`
- Vitest: `lib/design/liquid-glass-roots.test.ts` + `DashboardShell.test.ts`
- ESLint on touched TS/TSX
