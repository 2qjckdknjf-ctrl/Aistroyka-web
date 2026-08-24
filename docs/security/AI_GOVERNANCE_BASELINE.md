# AI Governance Baseline — AISTROYKA

**Version:** pilot-v1  
**Date:** 2026-08-24  
**Status:** EU AI governance baseline implemented; formal legal classification and compliance review remain external legal gates.

## 1. AI systems inventory

| System | Purpose | Provider | Data categories | Location | Human owner |
|--------|---------|----------|-----------------|----------|-------------|
| Report completeness evaluator | Deterministic field validation | None (rules engine) | Report metadata, media refs | EU Supabase (tenant-scoped) | Product/engineering |
| Governed pilot actions | Draft summaries, validations, reminders | Optional OpenAI when configured | Project/report/evidence refs | EU Supabase + provider region per env | Product/engineering |
| Vision analysis pipeline | Optional photo analysis | OpenAI (when `OPENAI_API_KEY` set) | Uploaded construction photos | Provider API + EU DB metadata | Product/engineering |
| Copilot / intelligence reads | Manager dashboards, signals | Optional LLM | Aggregated project state | EU Supabase | Product/engineering |
| Phase B action planner | Draft-only action proposals | Optional LLM | Project truth snapshot | EU Supabase | Product/engineering |

## 2. Human oversight

- All **CONSEQUENTIAL** and **DRAFT_ONLY** pilot actions require manager approval before external effect.
- Owner/customer messages cannot be sent autonomously (`draft_owner_message` → `pending_approval`).
- Report approval/rejection remains human-only (prohibited for AI — enforced in `prohibited-actions.ts`).
- AI outputs in owner portal are labeled (`clientPortalAiGenerated`).

## 3. Prohibited uses (enforced in code)

See `apps/web/lib/ai-governance/pilot/prohibited-actions.ts`:

- Approve/reject reports autonomously
- Change costs, deadlines, financial obligations
- Close issues, delete evidence, mutate RBAC
- Send unreviewed owner messages
- Evaluate/rank workers or HR decisions
- Apply migrations or change production config

## 4. Audit requirements

- All governed pilot executions write to `ai_action_audit_records` (append-only for users).
- Existing `audit_logs` continues for report submit/review and AI runtime events.
- Audit records include: action_id, policy_version, dry_run, outcome, idempotency_key, source_refs.

## 5. User disclosure

- Owner portal shows AI-generated badges where applicable.
- AI features remain optional — app functions without provider credentials.
- No hidden worker performance scoring.

## 6. Retention

| Data | Retention |
|------|-----------|
| `ai_action_audit_records` | Standard 90d (pilot); extended 365d for consequential drafts |
| `audit_logs` | Per tenant retention policy |
| Prompts / raw model output | Not stored in audit_logs by design |

## 7. Incident handling

1. Disable tenant AI via feature flags / env (`OPENAI_API_KEY` unset).
2. Review `ai_action_audit_records` and `audit_logs` for affected tenant/project.
3. Revoke stakeholder access if external visibility concern.
4. Escalate to human owner; legal review if customer-facing AI text sent in error.

## 8. Model / provider change process

1. Stage on staging.aistroyka.ai with `--require-live` AI smoke where applicable.
2. Update this inventory and `AI_POLICY_VERSION` if policy semantics change.
3. Protected PR + non-author approval before main merge.

## 9. Unresolved legal questions (external gates)

- Formal EU AI Act classification per function (likely limited-risk / minimal for current pilot scope — **not legal advice**).
- Cross-border transfer assessment for OpenAI processing when enabled.
- Customer contract addendum for AI-assisted owner updates.
- Workplace monitoring implications if future features evaluate workers (currently **prohibited**).

## 10. Risk review cadence

- Pilot: weekly engineering review of audit samples.
- Pre-GA: external legal + DPO review required.
