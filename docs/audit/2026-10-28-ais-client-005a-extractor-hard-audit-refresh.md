# AIS-CLIENT-005A hard audit refresh — 2026-10-28

Supersedes dependency claims in [2026-10-11-intake-extraction-hard-audit.md](./2026-10-11-intake-extraction-hard-audit.md) with current `origin/main` after Vision durable result, human review, Graph accepted lineage, async video executor, and Stage2a A01 storage (#463). This is still a **source/dependency audit**, not live LLM extraction certification.

## Verdict

**READY_FOR_FIRST_SLICE / REUSE_EXISTING** — Owner/evidence/Graph blockers that stopped extractor work on 2026-10-11 are largely closed on main. No owner-bound AI observation/room/zone tables or promote path exist yet. Manual `customer_intake_drafts` CRUD remains the foundation; do not rebuild it.

## Dependency closure vs 2026-10-11

| Dependency (2026-10-11) | 2026-10-28 fact |
|---|---|
| Source-linked Vision durable result | Present on main (report-media persist + `platform_job_id`) |
| Human review before Graph | `ai_analysis.review_status` + manager review API; Graph loads `review_status=accepted` only |
| Async video executor | Code-complete (#461); live Gemini fixture still separate evidence |
| Published evidence / Storage customer deny | Prior receipts remain; not re-proven in this audit |
| Quantity storage | A01 tables + manager API (#463); hosted apply done 2026-10-28 |
| Owner-bound preproject workspace | **Still absent** — intake drafts require `project_id`; no projectless owner workspace |
| AI observations / rooms / zones / promote | **Still absent** on `customer_intake_drafts` columns |

## Live intake schema (reuse)

`customer_intake_drafts`: id, tenant_id, created_by, project_id, title, description, site_context, location, requested_work_type, budget_range, desired_start/end, media_refs, questions, status, timestamps.  
No observation/suggestion/review columns. Customer `budget_range` is customer-facing commercial intent — not contractor cost/margin.

## Modules to reuse

- `apps/web/lib/domain/customer-intake/*` — draft lifecycle, media_refs validation, portal tenant resolve
- `apps/web/lib/domain/ai-analysis/review.*` — human verdict pattern (pending/accepted/rejected/insufficient_evidence)
- Async vision job + request_key lifecycle for photo analysis when project-scoped media exists
- Construction Graph accepted_analyses loader — promote only after human accept (do not auto-insert)

## First implementation slice (next engineering PR)

1. Additive tables (contractor-internal + portal-safe projection split):
   - `preproject_extraction_runs` (tenant, optional project_id, intake_draft_id, status, provider metadata)
   - `preproject_observations` (run_id, kind room/zone/work_item/note, payload jsonb, uncertainty, source coords, `review_status`)
2. Manager/portal review API: accept/reject/edit observation; **no** auto estimate/contract/assignment
3. Hermetic tests for RLS (stakeholder cannot see contractor-internal fields; no cost/margin keys)
4. One text-or-photo provider path with fail-closed recoverable draft on provider error
5. Live provider proof separately; video after verified executor fixture

## Explicit non-goals for first slice

- Auto-create project to satisfy FK
- Broad merge of old Storage/AI mixed PRs
- Customer surfaces showing contractor costs/margin
- Replacing manual intake CRUD
- A03–A05 Stage2a Worker/acceptance/commercial (parallel track)

## Finance boundary

Extractor observations must not embed unit_price, margin, profitability, subcontractor cost, or internal budget pressure. Customer estimate artifacts stay on existing customer-estimate surfaces only after deliberate commercial promotion (A05 / Phase commercial rules).
