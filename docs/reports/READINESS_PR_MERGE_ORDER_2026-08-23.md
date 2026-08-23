# Readiness PR merge order (100% program)

**Updated:** 2026-08-23  
**RC:** `v1.0.0-rc.1` @ `a7144249`

Merge **bottom-up** after non-author `APPROVED` on each PR head.

| Order | PR | Type | Notes |
|-------|-----|------|-------|
| 1 | [#228](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/228) | docs + Phase 1 fixes | Foundation |
| 2 | [#229](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/229) | **code** auth recovery | Security hardening pushed `a95cf9ed`; needs review |
| 3 | [#230](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/230) | docs security | |
| 4 | [#231](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/231) | docs web | |
| 5 | [#232](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/232)–[#237](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/237) | docs phases 5–10 | Can batch after #231 |
| 6 | [#240](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/240) | **code** pilot Day-0 pack | Operator tooling |
| 7 | [#238](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/238) | docs RC manifest | Tag `v1.0.0-rc.1` already on `a7144249` |
| 8 | [#239](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/239) | docs Phase 12 NO-GO | Evidence |

**Blockers:** non-author approval on protected `main`; real client intake for Phase 12 YES.
