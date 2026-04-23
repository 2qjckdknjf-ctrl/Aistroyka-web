# AI Brain Phase E — Targets and Boundaries

## Overview

Each optimization target is explicit, has version refs, and defines safe optimization boundaries. No hidden "misc optimization".

## Targets

| Layer | Description | Guardrails |
|-------|-------------|------------|
| prompt | Prompt set | no_secret_injection, no_prompt_removal, client_safe_preserved |
| policy | Action policy | no_safety_relaxation, approval_flow_preserved |
| planner | Planner logic | degradation_preserved, role_fit_preserved |
| tooling | Tool registry | no_arbitrary_tool_add, auth_preserved |
| output | Output contract | schema_validation_preserved, no_weakening |
| memory_retrieval | Memory config | tenant_scope_preserved, expiry_preserved |
| eval_config | Eval suite | no_case_removal, grading_strategy_bounded |

## API

- `getTargetDefinition(layer)` — Target definition with guardrails
- `validateTargetLayer(layer)` — Type guard
