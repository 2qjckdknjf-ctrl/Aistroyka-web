# AI analysis human review slice — 2026-10-28

## Gap

After durable report-media persistence (#457), `ai_analysis` rows had no explicit human verdict. Hard audit and Oct-23 queue require proposed status + human review before Graph promotion, with `INSUFFICIENT_EVIDENCE` for unusable sources. Customer/portal surfaces must never receive this contractor-internal review plane.

## Slice

1. Additive columns on `public.ai_analysis`: `review_status` (`pending|accepted|rejected|insufficient_evidence`), `reviewed_at`, `reviewed_by`, `review_note`.
2. Persist path writes `review_status=pending` (and explicit `tenant_id`).
3. Manager/admin API `POST /api/v1/ai/analysis/:id/review` records a terminal verdict via service role after `canManageTasks`; stakeholders/viewers denied.
4. Pure Graph gate helpers: only `accepted` is Graph-eligible. This slice does not invent Graph overlay nodes yet.
5. Audit action `ai_analysis_human_review` without finance fields.

## Out of scope (next)

- Video executor / cancel
- Full Graph lineage edges from reviewed observations
- Live Worker upload→result→retry→review fixture (needs staging credentials + cleanup)
- Docs roadmap merge of #453/#455
