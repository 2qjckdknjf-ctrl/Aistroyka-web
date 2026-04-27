# B2.2 ENV / CONFIG GOVERNANCE ALIGNMENT

## Goal

Align declared env/config governance with actual runtime/deploy truth.

## Starting Mismatch

- `lib/config/index.ts` declares `lib/config` as canonical declaration/validation layer.
- `docs/ENVIRONMENT-VARIABLES.md` was still Vercel-first, while active deploy automation is Cloudflare-first.

## What Was Changed

- Updated `docs/ENVIRONMENT-VARIABLES.md` header and operator sections to reflect:
  - Cloudflare Workers as canonical runtime path,
  - Vercel as legacy/fallback path where applicable.
- Kept `lib/config/index.ts` governance comment as canonical code-level declaration.

## Process.env Reality Snapshot

- `rg "process\\.env" apps/web` shows mixed usage across:
  - canonical config modules,
  - middleware/bootstrap paths,
  - provider adapters and scripts/tests.
- This is acceptable under current stated policy when explicitly bounded.

## Closure Verdict

**YES**

Reason: architecture docs/comments no longer materially misstate config ownership or deployment path priority.

