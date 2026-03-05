# Performance baseline — release 2026-03-05

## Build stats (from 03_next_build.txt)

- **Next.js:** 14.2.18
- **Routes:** 87 static/dynamic; App Router.
- **Shared JS (first load):** 87.2 kB (chunks 31.6 kB + 53.6 kB + 1.95 kB).
- **Largest route (first load):** `/[locale]/projects/[id]` ≈ 196 kB (12.4 kB page + shared).
- **Middleware:** 86.9 kB.

No obvious accidental large client dependency. Heaviest pages (admin/ai, dashboard, projects) are in the 178–196 kB range, which is acceptable for this app size.

## Optional bundle analysis

- Bundle analyzer is not enabled. To add later: install `@next/bundle-analyzer`, wrap `next.config` with `withBundleAnalyzer` when `ANALYZE=true`, and add script `"analyze": "ANALYZE=true next build"`.
- Not added in this release to avoid config and dependency churn.
