# Performance advisor audit — pilot governed AI PR tables (2026-08-24)

Scope: Supabase staging `vthfrxehrursfloevnlp` performance advisors on objects **introduced by PR #244**.

**Classification rule:** These are **PR-introduced findings using inherited project patterns** or **PR-introduced accepted performance debt**. They are **not** legacy/pre-existing repo debt — the tables, indexes, and policies did not exist before this PR.

Migration gate **closed:** `20260824150000` applied on staging. Initplan follow-up deferred to `PERFORMANCE_ADVISOR_FOLLOWUP_PILOT_GOVERNED_AI_RLS_INITPLAN_2026-08-24.md`.

| # | Advisor | Object | PR-introduced | Severity | Functional | Security | Pilot perf | Disposition | Follow-up owner | Milestone |
|---|---------|--------|---------------|----------|------------|----------|------------|-------------|-----------------|-----------|
| 1 | `unindexed_foreign_keys` | `ai_action_audit_records.project_id` FK | yes | INFO | none | none | low | **Accepted debt** — no dedicated leading-column FK index; composite `(tenant_id, executed_at)` indexes exist but do not cover FK-only lookups | Platform | Post-pilot: add `idx_ai_action_audit_project_id_fk ON (project_id)` if delete/update volume grows |
| 2 | `unindexed_foreign_keys` | `report_completeness_evaluations.report_id` FK | yes | INFO | none | none | low | **Accepted debt** — unique `(tenant_id, report_id)` covers primary read path; FK-only cascade path may still scan | Platform | Post-pilot: dedicated FK index if advisor persists |
| 3 | `unindexed_foreign_keys` | `visual_evidence_records.media_id` FK | yes | INFO | none | none | low | **Accepted debt** — partial index `idx_visual_evidence_media_fk ON (media_id) WHERE media_id IS NOT NULL` is not guaranteed FK-covering for all planner paths | Platform | Future index proposal |
| 4 | `unindexed_foreign_keys` | `visual_evidence_records.project_id` FK | yes | INFO | none | none | low | **Accepted debt** — `(tenant_id, project_id)` composite does **not** lead with `project_id` alone | Platform | Future index proposal |
| 5 | `unindexed_foreign_keys` | `visual_evidence_records.task_id` FK | yes | INFO | none | none | low | **Accepted debt** — partial `idx_visual_evidence_task` exists; FK-only path may still warn | Platform | Future index proposal |
| 6 | `unindexed_foreign_keys` | `visual_evidence_records.upload_session_id` FK | yes | INFO | none | none | low | **Accepted debt** — partial FK index exists; advisor still flags | Platform | Future index proposal |
| 7 | `auth_rls_initplan` | `ai_action_audit_service_role` | yes | WARN | none | none | low–medium at high write volume | **Deferred follow-up** — performance-only; service_role app path uses BYPASSRLS; policy is defensive | Platform | After PR #244 merge — see follow-up doc |
| 8 | `auth_rls_initplan` | `report_completeness_service_role` | yes | WARN | none | none | low–medium | **Deferred follow-up** — same rationale as #7 | Platform | After PR #244 merge |
| 9 | `unused_index` | `idx_visual_evidence_tenant_project` | yes | INFO | none | none | none (empty tables) | **Expected at pilot** — do not drop | Platform | Re-evaluate after QA/pilot traffic |
| 10 | `unused_index` | `idx_visual_evidence_pair_group` | yes | INFO | none | none | none | **Expected at pilot** | Platform | Re-evaluate after traffic |
| 11 | `unused_index` | `idx_ai_action_audit_tenant` | yes | INFO | none | none | none | **Expected at pilot** | Platform | Re-evaluate after traffic |
| 12 | `unused_index` | `idx_ai_action_audit_action` | yes | INFO | none | none | none | **Expected at pilot** | Platform | Re-evaluate after traffic |
| 13 | `multiple_permissive_policies` | `ai_action_audit_records` SELECT authenticated | yes | WARN | none | none | low | **Accepted performance debt** — tenant read OR service_role policy overlap; consolidation needs security review | Security/Platform | Post-pilot policy merge study |
| 14 | `multiple_permissive_policies` | `report_completeness_evaluations` SELECT authenticated | yes | WARN | none | none | low | **Accepted performance debt** | Security/Platform | Post-pilot |
| 15 | `multiple_permissive_policies` | `visual_evidence_records` SELECT authenticated | yes | WARN | none | none | low | **Accepted performance debt** — internal vs stakeholder OR branches | Security/Platform | Document OR semantics; merge only if proven safe |
| 16 | `multiple_permissive_policies` | `visual_evidence_records` UPDATE authenticated | yes | WARN | none | none | low | **Accepted performance debt** — worker vs manager visibility update split | Security/Platform | Post-pilot |

## Verdict

No functional or security blocker from performance advisors at pilot scale. No remote schema change required before authenticated E2E.
