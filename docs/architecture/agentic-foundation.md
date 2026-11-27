# Agentic Foundation (Slice 01)

**Status:** implemented on this branch, **feature-flagged off** by default (Stage 0).  
**Does not replace** AI Brain Phases A–E, Copilot, or platform AI governance.

## Purpose

Add a production-compatible Construction AI OS foundation:

`LLM reasons → Skills access controlled capabilities → Policy controls authority → Evidence supports conclusions → Audit records behavior → Human controls consequential writes`

Slice 01 is **read-only**. No autonomous writes. Future agents (Vision, Procurement, Cost, …) plug into the same protocol.

## Architecture

```text
AISTROYKA (existing Next.js / Supabase / Cloudflare Worker)
    │
    ├── AI Orchestrator          lib/agentic/orchestrator
    ├── Skill Registry           lib/agentic/skills
    ├── Construction Context     lib/agentic/graph/construction-context.ts
    ├── Construction Graph       construction_entities / construction_relations
    ├── Agent Action Envelope    lib/agentic/envelope
    ├── Policy / Approval        lib/agentic/policy (+ existing evaluateActionPolicy)
    ├── Evidence Contract        lib/agentic/contracts
    └── Audit Trail              audit_logs + agent_runs
```

Existing systems reused (not duplicated):

- Project truth snapshot, health v2, top risks, missing evidence, task signals (`lib/ai-brain`)
- Copilot provider / OpenAI JSON completion (`lib/platform/ai/openai-chat-completion`)
- Feature flags (`feature_flags` / `evaluateFlags`)
- Tenant + project access, RLS helpers
- `ai_policy_decisions` via `gateTenantAiRequest`
- `AiActionPanel` as the UI entry (new **Project AI** tab when flag is on)

Open PR #244 (pilot governed AI) is **not merged**; this slice does not copy that branch. Future write execution should converge with it.

## Components

| Component | Path |
|-----------|------|
| API | `POST /api/v1/projects/:id/agent` |
| Orchestrator | `runProjectAgent` |
| Skills | 10 read skills in `createReadSkills` |
| Graph bind | `bindSourceEntity` (idempotent on source_type+source_id) |
| Flag | `AGENTIC_FOUNDATION_ENABLED` + env `AGENTIC_FOUNDATION_MODE` |

## Security model

- Tenant identity comes only from `AgentExecutionContext` (request tenant), never from model JSON.
- Tenant role, project role, and agent capability roles are distinct. Tenant `member` is not mapped to manager.
- Unknown skill names → `AGENT_UNKNOWN_SKILL` / reject.
- No eval, dynamic handlers, model SQL, or arbitrary URL fetch.
- Worker `x-client` profiles are not on the lite allow-list for this route.
- Restricted actions (`payment`, `project_delete`, …) cannot execute; Slice 01 does not execute writes at all.
- Proposed actions strip `tenantId` / `projectId` / SQL / URL payloads.
- Authenticated clients are **SELECT-only** on `agent_runs`, `agent_run_steps`, `proposed_agent_actions`, and graph tables. Writes go through the Next.js orchestrator with the **service role**. `actor_user_id` is always the authenticated request user.
- Idempotency is scoped to `tenant + project + actor + route + key`. Replay JSON is re-validated with `AgentPublicResponseSchema`; malformed rows are a cache miss.
- Governance: missing admin client → `AGENT_GOVERNANCE_UNAVAILABLE` (503). Quota/rate-limit denials do not call the provider. Successful provider calls record usage via the existing Copilot `recordUsage` path; replay and deterministic fallback do not.

## Human-in-control policy

| Level | Mode | Slice 01 |
|-------|------|----------|
| 0 READ | READ skills | Allowed when flag on |
| 1 SUGGEST | proposed_agent_actions | Stored as `PROPOSED`, never executed |
| 2 PREPARE | drafts | Not executed |
| 3 EXECUTE_AFTER_APPROVAL | writes | Schema ready; no execute API |
| 4 RESTRICTED | payment, deletes, … | Always denied |

## Skill lifecycle

1. Register in `SkillRegistry` with typed definition.
2. `validateInput` → `authorize` → `execute`.
3. Persist step on `agent_run_steps`.
4. Unknown name is rejected before any handler lookup beyond the map.

## Agent lifecycle

1. Flag check → tenant/project access → optional idempotency replay.
2. Intent → required READ skills (deterministic).
3. Skills run with bounded queries.
4. LLM synthesizes JSON (`AgentResponseSchema`) or deterministic fallback.
5. Policy-filter proposed actions.
6. Persist run + audit.

## Data model

See [construction-graph.md](./construction-graph.md). Source of truth remains `worker_tasks`, `project_defects`, `worker_reports`, etc.

## Evidence

Factual claims must cite `AgentEvidence` with `sourceEntityType` + `sourceEntityId` (`lib/agentic/contracts/evidence.types.ts`). Signed URLs are not stored. Missing data → `INSUFFICIENT_EVIDENCE` in `limitations`.

## Audit

`agent_run_completed` in `audit_logs` plus `agent_runs` / `agent_run_steps`. No secrets, tokens, or signed URLs.

## Feature flags

| Knob | Effect |
|------|--------|
| `AGENTIC_FOUNDATION_MODE=disabled` | Always off (Stage 0 merge default) |
| `internal` | On when `NODE_ENV !== production` |
| `staging` | On when staging env; else DB flag |
| `selected_tenant` | DB allowlist / tenant override |
| `production` | DB `evaluateFlags` |

DB row `feature_flags.key = AGENTIC_FOUNDATION_ENABLED`, `rollout_percent = 0`.

## Failure handling

Stable codes: `AGENT_FEATURE_DISABLED`, `AGENT_PROJECT_ACCESS_DENIED`, `AGENT_UNKNOWN_SKILL`, `AGENT_POLICY_DENIED`, `AGENT_RESTRICTED_ACTION`, `AGENT_INSUFFICIENT_EVIDENCE`, `AGENT_PROVIDER_UNAVAILABLE` (limitation when synthesis falls back), `AGENT_GOVERNANCE_UNAVAILABLE`, `AGENT_INVALID_INPUT`.

Required skill query failures do not become empty counts. Run status may be `COMPLETED_WITH_LIMITATIONS`, `INSUFFICIENT_EVIDENCE`, or `FAILED`.

UI does not show stack traces.

## Future agents

Slice 02+ register new skills and agent types. They must not bypass the registry, policy, or graph source-binding rules.

## Rollout

- Stage 0: merged, disabled
- Stage 1: staging `AGENTIC_FOUNDATION_MODE=staging`
- Stage 2: selected tenant allowlist
- Stage 3: production read-only
- Stage 4 (later): governed writes (not this slice)

## Health formula (v1)

See `lib/agentic/health/project-health.ts` (wraps AI Brain v2): start 100; overdue tasks ×5 cap 25; no reports −15; no progress + overdue −20; GREEN ≥80, AMBER 60–79, RED <60.

**Migrations:** `apps/web/supabase/migrations/20260829120000_agentic_foundation.sql` — **not applied to production** in this slice.
