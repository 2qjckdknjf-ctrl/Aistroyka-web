# 03 — Deployment Gap Analysis

**Date:** 2026-06-28

---

## Corrected drift picture (runtime-first)

The 2026-06-20 assumption (production at `ff537c8`, behind main) is **no longer
current**. As of 2026-06-28:

| Axis | Finding | Gap? |
|------|---------|------|
| Production runtime vs current main | `buildStamp.sha7 = bc992b7` == main `bc992b72` | **NO deploy gap** |
| Production public landing vs Liquid Glass | 0 LG markers live; main has no LG dir | **NO — main itself lacks LG** |
| Current `main` vs LG design branches | LG public shell only on unmerged branches | **YES — merge gap** |

## What this means

- **There is no production↔main deployment drift.** Production is on current main.
- **Liquid Glass is not live, and not in main.** The LG public shell + dashboard
  glass work lives on `feature/unified-product-design-certification` /
  `release/web-pilot-rc` and has **not been merged to main**.
- The real outstanding item is a **merge decision** for the LG design branches,
  not a redeploy of main.

## Claims that remain UNSAFE

- ❌ Do **not** claim Liquid Glass / new public shell is live on production.
- ❌ Do **not** claim the LG design branches are deployed.
- ❌ Do **not** claim production GA of the redesigned public site.

## Claims now SUPPORTED by evidence

- ✅ Latest `main` (`bc992b7`) **is** deployed to production (build stamp match).
- ✅ Production health is green (`ok:true`, db ok, supabase reachable).

## Required evidence before any "LG is live" / "redesign deployed" claim

1. LG design branch merged to `main` (PR + non-author APPROVED review + checks PASS)
2. Deploy command/output (Cloudflare) for the new main SHA
3. Cloudflare deployment id
4. `/api/v1/health` `buildStamp.sha7` matching the new expected SHA
5. Public landing Liquid Glass marker check returning **> 0** markers
6. Non-mutating smoke result PASS
