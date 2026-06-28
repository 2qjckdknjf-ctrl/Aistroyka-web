# 02 — Main Liquid Glass State

**Date:** 2026-06-28  
**Base main:** `d54278c680162cf8af598466fda1d72dc9c733dc`

---

## LG files on main

```
find apps components lib styles public -type f | grep -Ei "liquid|glass|LiquidGlass|GlassRoot"
→ (no results)
```

There is **no** `apps/web/components/design/liquid-glass/` directory, **no**
`apps/web/styles/liquid-glass.css`, and **no** public LG components on main.

## LG marker search on main (source only)

```
grep -rIn "liquid-glass|PublicLiquidGlass|AppGlassRoot|LiquidGlass" apps/web \
  --include='*.tsx' --include='*.ts' --include='*.css'  (excluding .next/.open-next)
→ 0 matches
```

(Two raw matches exist only in generated build artifacts under `.next`/`.open-next`
and do not count as source.)

## Public landing LG usage on main

- `apps/web/app/[locale]/(public)/layout.tsx` and `PublicHomeContent.tsx` on main
  do **not** import or render any LiquidGlass / glass-shell components.

## Relation to PR #149 production evidence

| Fact | Source |
|------|--------|
| Production `buildStamp.sha7 = bc992b7` matched main | PR #149 |
| Live `/en` had 0 LG markers | PR #149 |
| Main has 0 LG source markers | this recon |

## Conclusion

**Liquid Glass is not live because it is not in `main`** — not because the deploy
is stale. Production faithfully reflects a main that has never contained LG. The
gap is entirely **main ↔ LG design branches**, which is a *merge* decision, not a
redeploy.
