# Schema: assurance_graph (ROMA-VER-009 / GROW-MEM-004)

**Schema ID:** `roma.schema.assurance_graph`  
**Version:** `ag_v1`  
**Artifact:** `assurance_graph.json`  
**Stage:** 2D→3 advisory first slice  
**Parent:** [ROMA execution assurance plan](../ROMA_EXECUTION_ASSURANCE_PLAN_2026-09-23.md)

## Purpose

Trace Requirement → Acceptance Criterion → Verification Contract → Test/Observation → Evidence → Verifier → Verdict.

This slice is **advisory**. A valid graph does not authorize merge, deploy, or PASS on a release. Missing, failed, or stale evidence must not produce `PASS`. Coverage is counted by release requirements (including manual criteria), not by test count.

## Required root fields

| Field | Type | Description |
|---|---|---|
| `schema_version` | string | `ag_v1` |
| `graph_id` | string | Stable graph id |
| `requirement_id` | string | e.g. `REQ-AUTH-PROJECT-001` |
| `requirement_revision` | string | Requirement revision |
| `commit_sha` | string | Full git SHA the graph claims |
| `environment` | enum | `local` \| `staging` \| `preprod` \| `production` |
| `generated_at` | string | ISO 8601 |
| `tool_version` | string | Producer version |
| `origin` | string | Producer identity |
| `nodes` | array | Typed nodes |
| `edges` | array | Directed links |

## Node types

| `type` | Required besides `id` |
|---|---|
| `requirement` | `revision` |
| `acceptance_criterion` | `requirement_id`, `text` |
| `verification_contract` | `acceptance_criterion_id`, `kind` (`test` \| `observation` \| `manual`) |
| `observation` | `verification_contract_id`, `result` (`pass` \| `fail` \| `missing`) |
| `evidence` | `observation_id`, `artifact_hash`, `commit_sha`, `environment`, `recorded_at`, `tool_version`, `origin` |
| `verifier` | `independent` (boolean; executor cannot be the sole verifier) |
| `verdict` | `status` (`PASS` \| `FAIL` \| `INCOMPLETE` \| `STALE`) |

## Edges

`from` / `to` node ids. Allowed chain: requirement → acceptance_criterion → verification_contract → observation → evidence → verifier → verdict.

## Advisory evaluation

1. Any `observation.result` of `missing` or absent evidence → `INCOMPLETE`.
2. Any `observation.result` of `fail` → `FAIL`.
3. Evidence `commit_sha` or `environment` that does not match the evaluation context → `STALE` (not `PASS`).
4. Executor-only verifier (`independent: false` with no independent verifier) → `INCOMPLETE`.
5. `PASS` only if every acceptance criterion has independent, current, passing evidence.

JSON Schema: `assurance_graph.schema.json`. Fixture: `docs/roma/fixtures/assurance_graph.REQ-AUTH-PROJECT-001.json`.
