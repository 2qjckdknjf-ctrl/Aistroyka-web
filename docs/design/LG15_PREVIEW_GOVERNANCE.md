# LG-1.5 Preview Governance

**Date:** 2026-06-18  
**Sprint:** LG-1.5 Technical Debt Closure

---

## Scope

| Asset | Type | LG-1.5 action |
|-------|------|---------------|
| `/[locale]/design/liquid-glass` dev route | Code (preview page) | **KEEP** |
| `public.glass` i18n keys | Messages (spike orphan) | **REMOVE** |
| `public.home.heroPreview` i18n keys | Messages (spike orphan) | **REMOVE** |

---

## Dev preview route — KEEP

**Path:** `apps/web/app/[locale]/design/liquid-glass/`

| Criterion | Status |
|-----------|--------|
| Useful for future LG phases | **YES** — exercises canonical primitives before LG-2 |
| Isolated | **YES** — not linked from `PublicHeader`, sitemap, or marketing nav |
| Not reachable in production | **YES** — `notFound()` when `NODE_ENV === 'production'` |
| Documented | **YES** — `LIQUID_GLASS_LG1_FOUNDATION_REPORT.md`, `LIQUID_GLASS_PERFORMANCE_GUARDRAILS.md` |

Preview uses **hardcoded dev-only English strings** in `LiquidGlassPreviewClient.tsx` (appropriate for internal primitive lab; LG-2 will add proper i18n for public surfaces).

**No code changes to preview route in LG-1.5.**

---

## Spike i18n keys — REMOVE

### Keys removed

| Key path | Locales | Former purpose |
|----------|---------|----------------|
| `public.glass.intensity` | en, ru, es, it | Spike `GlassIntensityControl` on public home |
| `public.home.heroPreview.*` | en, ru, es, it | Spike `HeroSitePreview` mock labels |

7 leaf keys per locale (`heroPreview` had 6 children + `glass.intensity`).

### Why REMOVE (not KEEP)

1. **Zero code references** — grep across `apps/web` found no `t('...glass')` or `t('...heroPreview')` usage after spike reconciliation.
2. **Spike reverted** — public marketing no longer renders glass hero preview.
3. **LG-2 will author fresh keys** — avoids stale copy and namespace drift.
4. **No production dependency** — removal cannot break shipped UI.

### KEEP criteria evaluation

| Criterion | `public.glass` / `heroPreview` |
|-----------|----------------------------------|
| Preview useful | N/A — keys are not the dev preview route |
| Isolated | Orphan strings, not wired |
| Not in production | Unused entirely |
| Documented | Only in spike-era docs |

**Decision: REMOVE.**

### Execution

Removed from `apps/web/messages/{en,ru,es,it}.json`. Verified:

```bash
grep -r 'heroPreview\|"glass"' apps/web/messages/  # 0 matches
```

Branch `HEAD` already lacked these keys in committed history; LG-1.5 removed them from working-tree copies left from the spike.

---

## Governance outcome

| Item | Decision | Status |
|------|----------|--------|
| Dev preview route | KEEP | Production-safe, documented |
| `public.glass` | REMOVE | Done |
| `public.home.heroPreview` | REMOVE | Done |

**Preview governance: RESOLVED.**
