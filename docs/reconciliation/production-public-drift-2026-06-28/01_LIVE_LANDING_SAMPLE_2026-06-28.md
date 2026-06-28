# 01 — Live Landing Sample

**Date:** 2026-06-28  
**URL checked:** `https://aistroyka.ai/en`

---

## Curl behavior

- **Original (prior session) curl had no timeout** and hung ~2.5 minutes with no
  output (operator error: missing `--max-time`). This was a tooling issue, not a
  production outage.
- **This run used `--max-time 20`** (and `-L` to follow redirects).

## Result

| Field | Value |
|-------|-------|
| HTTP status | **200** (`HTTP/2 200`) |
| HTML size | **183,058 bytes** (~183 KB) |
| Liquid Glass marker count | **0** |
| Server header | `cloudflare` |

## Exact markers searched

```
liquid-glass
PublicLiquidGlass
AppGlassRoot
glass-filter
Liquid Glass
hero lens
glass-shell
```

Broader secondary grep (`glass|liquidglass|lens|ambient|backdrop-filter`) on the
sampled HTML also returned **0** matches.

## Conclusion

- The live landing sample contains **no Liquid Glass markers**.
- **Important nuance (see `02` and `03`):** this does **not** prove a deployment
  lag. Current main (`bc992b72`) itself contains **no** `liquid-glass` components
  and no LG references in its public landing source. So 0 markers on production is
  **consistent with current main** — not evidence that production is behind main.
- The Liquid Glass public shell remains on **unmerged design branches**
  (e.g. `feature/unified-product-design-certification`, `release/web-pilot-rc`),
  not on `main`.

**Safe statement:** production public landing does **not** show Liquid Glass, and
current main does **not** ship Liquid Glass. Do **not** claim Liquid Glass is live.
