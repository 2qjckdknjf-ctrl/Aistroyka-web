# Performance advisor audit — pilot governed AI PR tables (2026-08-24)

Scope: Supabase staging `vthfrxehrursfloevnlp` performance advisors on objects introduced by PR #244 migrations (`20260824122312`–`20260824150000`).

**Important:** These tables and policies are **new in this PR**. Findings are not legacy repo debt; they are **pilot-scale performance advisories** on newly created objects.

| # | Advisor | Object | Introduced in PR | Class | Pilot impact | Disposition | Remediation owner | Milestone |
|---|---------|--------|------------------|-------|--------------|-------------|-------------------|-----------|
| 1 | `unindexed_foreign_keys` | `ai_action_audit_records.project_id` → FK | `20260824122312` | performance-only | Low at pilot volume; admin/service reads by tenant | **Accepted debt** — partial index `idx_ai_action_audit_project` exists (`WHERE project_id IS NOT NULL`); advisor wants dedicated FK index | Platform | Post-pilot scale review |
| 2 | `unindexed_foreign_keys` | `report_completeness_evaluations.report_id` → FK | `20260824122312` | performance-only | Low; unique `(tenant_id, report_id)` covers primary lookup | **Accepted debt** — `idx_report_completeness_report_fk` present; advisor may not recognize as FK-covering | Platform | Post-pilot scale review |
| 3 | `unindexed_foreign_keys` | `visual_evidence_records.media_id` → FK | `20260824122312` | performance-only | Low; partial index `idx_visual_evidence_media_fk` exists | **Accepted debt** (partial index vs advisor heuristic) | Platform | Post-pilot scale review |
| 4 | `unindexed_foreign_keys` | `visual_evidence_records.project_id` → FK | `20260824122312` | performance-only | Low; composite `idx_visual_evidence_tenant_project` covers tenant+project queries | **Accepted debt** | Platform | Post-pilot scale review |
| 5 | `unindexed_foreign_keys` | `visual_evidence_records.task_id` → FK | `20260824122312` | performance-only | Low; partial `idx_visual_evidence_task` exists | **Accepted debt** | Platform | Post-pilot scale review |
| 6 | `unindexed_foreign_keys` | `visual_evidence_records.upload_session_id` → FK | `20260824122312` | performance-only | Low; partial `idx_visual_evidence_upload_session_fk` exists | **Accepted debt** | Platform | Post-pilot scale review |
| 7 | `auth_rls_initplan` | `ai_action_audit_records` policy `ai_action_audit_service_role` | `20260824122312` / hardened `20260824150000` | performance-only (RLS plan) | Medium at high write volume; **not a security defect** | **Fix prepared locally** — forward migration `20260824160000` wraps `(select auth.role())`; **not applied remote** (owner gate) | PR #244 author | After E2E PASS + owner approval |
| 8 | `auth_rls_initplan` | `report_completeness_evaluations` policy `report_completeness_service_role` | same | performance-only | Medium at high write volume | **Fix prepared locally** — same `20260824160000` | PR #244 author | After E2E PASS + owner approval |
| 9 | `unused_index` | `idx_visual_evidence_tenant_project` | `20260824122312` | performance-only | None — tables empty / no production traffic yet | **Accepted debt** — do **not** drop; needed for portal/tenant queries | Platform | Re-evaluate after pilot traffic |
| 10 | `unused_index` | `idx_visual_evidence_pair_group` | `20260824122312` | performance-only | None pre-traffic | **Accepted debt** | Platform | Re-evaluate after pilot traffic |
| 11 | `unused_index` | `idx_ai_action_audit_tenant` | `20260824122312` | performance-only | None pre-traffic | **Accepted debt** | Platform | Re-evaluate after pilot traffic |
| 12 | `unused_index` | `idx_ai_action_audit_action` | `20260824122312` | performance-only | None pre-traffic | **Accepted debt** | Platform | Re-evaluate after pilot traffic |
| 13 | `multiple_permissive_policies` | `ai_action_audit_records` SELECT for `authenticated` | `20260824150000` | performance-only | Low — intentional split: tenant read + service_role path | **Accepted debt** — RBAC design requires separate policies | Security/Platform | Document; consolidate only if proven safe |
| 14 | `multiple_permissive_policies` | `report_completeness_evaluations` SELECT for `authenticated` | `20260824150000` | performance-only | Low — service writes vs tenant read | **Accepted debt** | Security/Platform | Document |
| 15 | `multiple_permissive_policies` | `visual_evidence_records` SELECT for `authenticated` | `20260824150000` | performance-only | Low — internal vs stakeholder visibility split | **Accepted debt** — required for owner/stakeholder isolation | Security/Platform | No change pre-pilot |
| 16 | `multiple_permissive_policies` | `visual_evidence_records` UPDATE for `authenticated` | `20260824150000` | performance-only | Low — worker update vs manager visibility update | **Accepted debt** — manager visibility guard relies on split | Security/Platform | No change pre-pilot |

## Verdict

- **No functional or security blocker** from performance advisors at pilot scale.
- **Two WARN initplan items** have a **local forward-fix migration prepared** (`20260824160000`); remote apply is a **separate owner-gated step**, not part of closed migration `50000` gate.
- **Do not drop** unused indexes on empty pilot tables solely due to advisor noise.
