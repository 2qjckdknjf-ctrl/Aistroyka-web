# Graph accepted-analysis lineage — 2026-10-28

## Gap

Oct-23 queue M2→M3: after durable result + human review, Construction Graph must include only accepted vision results. Pending/rejected/insufficient_evidence must not become Graph nodes or AI context evidence.

## Slice

- `buildConstructionGraphFromSources` accepts optional `accepted_analyses` and emits `ai_analysis` evidence nodes edged to media.
- `queryProjectConstructionGraph` loads `ai_analysis` with `review_status=accepted` for project media ids only.
- Orphan media ids and non-accepted rows are dropped.

## Out of scope

- Video executor / cancel
- Spatial calibration / rooms
- Live Worker upload→review→graph fixture
- Customer projection of analysis (remains denied)
