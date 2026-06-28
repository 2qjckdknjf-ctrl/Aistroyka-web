# 05 — Risk Register (Liquid Glass shipment)

**Date:** 2026-06-28

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| R1 | **Stale LG branches** (all 80+ behind main) | High | Merge conflicts, regressions | Re-slice on fresh `main`; never merge stale branch as-is |
| R2 | **Broad branch merge** (web-pilot-rc 269 / lg2a 349 / unified 721 files) | High | Unreviewable blast radius; pulls flywheel/iOS/Android | Small per-slice PRs; strict allowlist; DO_NOT_BROAD_MERGE on lg2a + unified |
| R3 | **package.json tooling reverts** in `release/web-pilot-rc` | Certain (present) | Regresses main lint/test/i18n scripts | Exclude all `package.json` diffs from slices |
| R4 | **Design token drift** (`globals.css`, `liquid-glass.css`) | Medium | Visual regressions, raw-color debt | Additive CSS only; run `check:design` (raw colors); visual review |
| R5 | **i18n drift** (4 message bundles modified on branch) | Medium | Key parity failures across en/ru/es/it | Add only needed keys; `i18n:check` + `I18N_CHECK_ALL=1` must PASS |
| R6 | **Hydration/build risk** from new client components / glass filters | Medium | SSR/runtime errors on Workers | `bun run build` + `bun run cf:build` gate every slice |
| R7 | **Production marker false-negative** | Low | Wrongly concluding LG missing | Use timeout-capped curl; check multiple markers; confirm against build SHA |
| R8 | **Deploy/buildStamp evidence requirement** | Certain | Risk of false "LG live" claim | Require `/api/v1/health` sha7 == new main + `/en` LG markers > 0 before any claim |
| R9 | **PR #148 (Android) entanglement** | Low | Mixing mobile evidence with LG | Keep LG slices strictly separate from PR #148 |
| R10 | **ai-flywheel PRs (#103/#104/#106)** riding along | Low | Unrelated backend/AI surface in LG merge | Do not include; review separately |

## Top P0/P1 going into shipment

- **P1:** all candidate LG branches are stale (R1) and the cleanest one carries
  tooling reverts (R3) → mandatory fresh re-slice.
- **P1:** broad-merge temptation (R2) → enforce small slices + allowlist.
- No **P0** blockers for *recon*; P0 would only arise if a slice touched
  auth/RBAC/API/middleware (explicitly forbidden).
