# LG-3.2 Features — No-Tail Audit

**Date:** 2026-06-18 (updated — overlap tail closure)  
**Route:** `/features`  
**Authority:** Principal Information Architecture Auditor + Public Website Closure Lead

---

## Mandated surface tail scan

| Check | Status |
|-------|--------|
| Legacy 8-card flat grid | ✅ Removed |
| `metaDescription` as visible body | ✅ Removed |
| Single `aiAnalytics` card | ✅ Split → Construction AI + Copilot |
| Request Demo / Book Demo | ✅ Absent |
| Footer `PublicCTASection` | ✅ Present |
| Platform stack / timeline / lens on Features | ✅ Absent |
| Glass budget ≤ 3 incl. nav | ✅ 3 nodes |
| Single h1 | ✅ |
| i18n 4-locale parity | ✅ 3042 leaf keys tree |
| Dead legacy feature keys | ✅ Removed |
| build + cf:build | ✅ PASS |

---

## Cross-page link closure (P3 tails resolved)

| Tail | Status | Implementation |
|------|--------|----------------|
| **Home → Features** | ✅ **CLOSED** | `PublicHomeContent` modules section: `public.home.seeAllFeatures` → `/features` (EN/RU/ES/IT). Home remains 4-card teaser; Features remains canonical catalog. |
| **Platform → Features** | ✅ **CLOSED** | `platform/page.tsx` after capability map: `public.platform.exploreAllFeatures` → `/features` (EN/RU/ES/IT). Platform stack/timeline unchanged. |
| **Integrations legacy page** | 📋 **Future phase** | Not redesigned in LG-3.2. Features connectivity section + related strip link to `/integrations`; full page refactor deferred. |

---

## Overlap recheck (Features vs peers)

| Peer | Features role | Peer role | Overlap handling |
|------|---------------|-----------|------------------|
| **Homepage** | Canonical catalog | Outcome + 4-module teaser | ✅ Teaser kept; outbound link added |
| **Platform** | Granular module tiles | Stack map + timeline | ✅ Strategic 6-cap unchanged; catalog link added |
| **Mobile** | Field capability tiles | Field workflow UX | ✅ Features describes what exists; links to Mobile |
| **AI Control** | Construction AI catalog tile | Analysis pipeline depth | ✅ One-line + link; no pipeline on Features |
| **Copilot** | Copilot catalog tile | Assistant workflow | ✅ Separate tile; no chat mock on Features |

**Verdict:** No hidden duplication. Each page retains distinct ownership.

---

## CTA tail scan

| Item | Classification |
|------|----------------|
| Launch pilot / Contact us / Get presentation | **KEEP** — canonical |
| Hero inline CTAs on Features | **KEEP** absent (`ctas={false}`) |
| Request Demo | **KEEP** absent |

---

## i18n tail scan

| Key group | Status |
|-----------|--------|
| `public.features.*` (~74 keys) | **KEEP** — canonical catalog |
| `public.home.seeAllFeatures` | **ADDED** — 4 locales |
| `public.platform.exploreAllFeatures` | **ADDED** — 4 locales |
| Hardcoded English in changed surfaces | **NONE** |

---

## Glass tail scan (unchanged)

| Node | Count |
|------|-------|
| GlassNav | 1 |
| Features `constructionAi` highlight | 1 |
| Features floating CTA | 1 |
| Home / Platform glass | Unchanged (no new glass nodes) |

---

## Remaining risks (P3 only)

| ID | Risk | Blocks closure? |
|----|------|-----------------|
| R-01 | `/integrations` page still legacy shell | No — documented future phase |
| R-02 | Home module copy still semantically overlaps first catalog tiles | No — intentional teaser + link |
| R-03 | Platform `capabilitiesSubtitle` mentions “full surface” while Features owns granular list | No — complementary framing |

No P0/P1/P2 issues.

---

## Validation results (2026-06-18)

| Command | Exit |
|---------|------|
| `bun run check:design` | 0 |
| `bun run lint` | 0 |
| `tsc --noEmit` | 0 |
| `bun run i18n:check` | 0 |
| `I18N_CHECK_ALL=1 bun run i18n:check` | 0 (3042 leaf keys) |
| `bun run build` | 0 |
| `bun run cf:build` | 0 |

---

## Final verdict

# LG-3.2 FULLY CLOSED

Features catalog IA is complete. Home and Platform outbound links close the known P3 overlap tails. Integrations page refactor explicitly deferred to a future phase. Ready for commit (Features implementation + tail closure in one changeset when approved).
