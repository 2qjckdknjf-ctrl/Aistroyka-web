# AI Brain Phase D — Versioning Spec

## Overview

Version reference tracking allows the system to know what combination of components produced a given run or eval result. Refs are typed and attributable.

## Tracked layers

| Layer | Description |
|-------|-------------|
| prompt | Prompt version |
| policy | Policy version |
| planner | Planner version |
| tool_registry | Tool registry version |
| output_contract | Output contract version |
| memory_retrieval | Memory retrieval version |
| orchestrator | Orchestrator version |

## AiVersionRef

```ts
interface AiVersionRef {
  layer: string;
  version: string;
  ref?: string;
}
```

- `layer` — Component identifier
- `version` — Version string (e.g. phase_d_v1, git sha, tag)
- `ref` — Optional additional ref (e.g. route identity)

## Integration

- **Run recording** — `captureVersionRefs()` called at record time, stored in `ai_run_records.version_refs`
- **Eval results** — Same capture at eval run time, stored in `ai_eval_results.version_refs`

## Implementation

- `captureVersionRefs()` — Returns current layer versions. Today uses placeholder; can be extended to read from package.json, env, or build metadata.

## Non-goals

- Full release platform
- Automatic version inference from git (optional future)
