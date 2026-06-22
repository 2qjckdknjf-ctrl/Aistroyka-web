# LG-2B Glass Governance

**Date:** 2026-06-18  
**Budget source:** `LG_MAX_VISIBLE_NODES = 6` (`lib/design/liquid-glass.ts`)  
**Global rule:** One `LiquidGlassFilter` mount per public layout (LG-2A — unchanged)

---

## 1. Allowed glass surfaces (any marketing page)

| Surface | Component | Max per page | Notes |
|---------|-----------|--------------|-------|
| Header nav | `GlassNav` | 1 (layout) | Already LG-2A |
| Hero visual capsule | `GlassHeroCard` | 1 | Non-home: `split-visual` hero only |
| Feature highlight | `GlassSurface` | 1–2 | One flagship card; optional second for status chip |
| Floating CTA band | `GlassPanel` | 1 | Short label + buttons; no paragraph text inside |
| Status / metric chip | `GlassSurface` | 0–2 | **Homepage hero only** for numeric chips; other pages use solid stats |

---

## 2. Forbidden glass surfaces

| Surface | Reason |
|---------|--------|
| FAQ answers | Long text; contrast failure |
| Comparison / pricing tables | Dense data |
| Feature grid (bulk) | Budget explosion; readability |
| Form fields (`ContactForm`) | Input clarity |
| Legal prose (`privacy`, `terms`) | Accessibility |
| Code blocks (`/api`) | Developer readability |
| Mock chat transcript body (`CopilotMockUI`) | Use solid panel; glass on chrome only if needed |
| Nested glass (`GlassSurface` inside `GlassHeroCard` text) | GPU + tint stack |
| Footer | Policy: solid footer always |

---

## 3. Per-page glass budget (LG-2B.1–2B.6)

Counts include layout `GlassNav` (+1).

| Page | Allowed glass nodes | Placement |
|------|---------------------|-----------|
| **Home `/`** (LG-2A) | 6 | Nav + lens + 4 metric chips |
| **Platform** | ≤ 4 | Nav + 1 hero visual card + 0–1 highlight module + 0–1 floating CTA |
| **Mobile** | ≤ 4 | Nav + 1 device frame card + 0–1 floating CTA |
| **Copilot** | ≤ 3 | Nav + 0–1 mock UI chrome strip + 0–1 floating CTA; **mock chat body solid** |
| **About** | ≤ 2 | Nav + 0–1 floating CTA only |
| **FAQ** | ≤ 2 | Nav + 0–1 floating CTA only; **Q&A cards solid** |
| **Contact** | ≤ 2 | Nav + 0–1 floating CTA; **form solid** |

---

## 4. Per-page glass budget (phase 2 routes)

| Page | Max nodes | Notes |
|------|-----------|-------|
| `/features`, `/solutions`, `/security` | 3 | Nav + floating CTA |
| `/pricing` | 3 | Nav + floating CTA; plan cards solid |
| `/enterprise`, `/integrations`, `/api` | 4 | Nav + hero optional + floating CTA |
| `/ai-construction-control` | 3 | Nav + 1 highlight card max |
| `/ai-demo` | 3 | Nav + simulator chrome; simulator solid |
| `/workflows`, `/implementation`, `/partners` | 3 | Nav + floating CTA |
| `/cases`, `/docs`, `/projects-showcase` | 2 | Nav + floating CTA optional |
| `/privacy`, `/terms` | 1 | Nav only |

---

## 5. Variant intensity rules

| Context | `GlassSurface` intensity | Motion |
|---------|--------------------------|--------|
| Hero visual | `medium` | `enter` once; no float except homepage lens |
| Highlight card | `subtle` | No float |
| Floating CTA | `subtle` | No float |
| Nav scroll | adaptive via `useGlassNavScrolled` | Existing LG-2A behavior |

Reference: `styles/liquid-glass.css` — displacement disabled ≤480px.

---

## 6. Homepage vs other pages

| Rule | Homepage | Other pages |
|------|----------|-------------|
| `PublicHeroLens` | ✅ Allowed | ❌ Forbidden |
| `PublicHeroMetrics` glass chips | ✅ Allowed | ❌ Use solid `PublicProofSection` |
| Full 6-node budget | ✅ Hero signature | ❌ Target 2–4 nodes typical |

---

## 7. Reduced motion / transparency

Inherited from LG-1 (no LG-2B changes required):

- `prefers-reduced-motion: reduce` → ambient glow static; SVG seed animation off
- `prefers-reduced-transparency: reduce` → glass falls back to opaque surface tokens

Marketing pages must remain readable with both prefs enabled.

---

## 8. Enforcement checklist (implementation gate)

Per page PR:

- [ ] Count `.lg` / `Glass*` components in above-fold DOM ≤ budget
- [ ] No glass behind `p` tags > 120 characters
- [ ] No nested glass components
- [ ] `bun run check:design` pass
- [ ] Manual pass at 390px viewport

---

## 9. Decision log

| Question | Decision |
|----------|----------|
| Glass on platform module cards? | **No** — one hero visual + solid grid |
| Glass on copilot mock chat? | **No** — solid chat panel |
| Glass on contact form card? | **No** — border + solid surface |
| Floating glass CTA on every page? | **Optional** — prefer solid `band` if budget tight |
