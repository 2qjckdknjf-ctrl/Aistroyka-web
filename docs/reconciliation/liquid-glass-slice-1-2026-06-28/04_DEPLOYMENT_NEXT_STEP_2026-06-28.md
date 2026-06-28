# Liquid Glass — Slice 1 — Deployment Next Step

Date: 2026-06-28

## Deploy not performed

This PR is code-only. No deploy, no mutating smoke, no migrations, no live data touched.
Liquid Glass is **not** claimed live by this PR.

## After protected merge (separate controlled deploy operator)

A separate, controlled deploy operator must:

1. Deploy staging → run non-mutating smoke → then production (per `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md`).
2. Verify `GET /api/v1/health` `buildStamp.sha7` == new merged `main` short SHA.
3. Verify `GET https://aistroyka.ai/en` returns HTTP 200.
4. Verify `/en` contains Liquid Glass markers > 0 (`liquid-glass | PublicLiquidGlassRoot | PublicAmbientField | glass-filter | AppGlassRoot | surface-glass`).
5. Run non-mutating smoke only.

Only after buildStamp + live markers are both verified may "Liquid Glass live" be claimed.

## Notes

- Other public pages (features, pricing, platform, etc.) keep their existing main markup; they now render inside the new glass shell (header/footer/ambient) but their bodies are unchanged in this slice. Body redesigns are deferred to later slices.
- The re-slice source `origin/release/web-pilot-rc` carried `package.json` tooling reverts and a much larger i18n surface; both were intentionally excluded here.
