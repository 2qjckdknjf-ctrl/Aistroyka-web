# Legacy root app leftovers

Remnants of the pre-monorepo Next.js app that lived at the repository root
before the move to `apps/web` (the app tree itself was archived earlier in
`archive/legacy-app`). Nothing references these files:

- `apps/web` has its own `next.config.js`, `tailwind.config.ts`,
  `postcss.config.js`, `middleware.ts`, `public/`;
- no script, workflow, or package imports the root `lib/` or `components/`;
- the root Vercel project that consumed them is dead (see
  docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md).

Archived by the 2026-06-11 audit follow-up instead of deleted, per repo
convention. Safe to remove entirely after one release cycle.
