# AIS-CLIENT-005A first observation slice — closure

**Date:** 2026-10-28  
**Branch:** `feat/ais-client-005a-observation-slice-2026-10-28`  
**Audit:** [docs/audit/2026-10-28-ais-client-005a-extractor-hard-audit-refresh.md](../../audit/2026-10-28-ais-client-005a-extractor-hard-audit-refresh.md)  
**Verdict:** YES (heuristic reviewed pipeline; not live LLM certification)

## Delivered

- Migration: `preproject_extraction_runs`, `preproject_observations` (internal-writer RLS)
- Deterministic `text_heuristic.v1` extractor (EN/RU room/work keywords)
- Service: create run + human review (accepted/rejected/edited); run status rollup
- API: `POST/GET /api/v1/projects/:id/preproject/extractions`, `POST /api/v1/preproject/observations/:id/review`
- Finance boundary: commercial keys forbidden in observation payloads; no auto estimate/contract/assign

## Checks

| Check | Result |
|---|---|
| vitest heuristic extractor | 3/3 PASS |
| eslint touched files | PASS |
| tsc (no preproject errors) | PASS |

## Not claimed

- Live LLM/photo provider proof
- Portal customer projection of observations
- Graph promote / project auto-create
- Stage2a A03–A05

## Hosted apply

Apply `20261028170000_preproject_extraction_observations.sql` to AISTROYKA after merge.
