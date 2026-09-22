# Skill Registry

Skills are **controlled capabilities**, not prompts.

## Contract

```ts
interface AgentSkill<I, O> {
  definition: SkillDefinition
  validateInput(input: unknown): I
  authorize(context: AgentExecutionContext): Promise<void>
  execute(context: AgentExecutionContext, input: I): Promise<SkillResult<O>>
}
```

Dispatch is an explicit `Map<name, handler>`. Unknown names are rejected.

## Slice 01 read skills

| Name | Wraps |
|------|--------|
| `get_project_state` | `assembleProjectTruthSnapshot` |
| `get_project_summary` | snapshot aggregates |
| `get_open_issues` | `project_defects` + `project_issues` |
| `get_overdue_tasks` | `worker_tasks` due_date |
| `get_recent_reports` | `listReportsForManager` |
| `get_project_members` | `project_members` (manager/admin only) |
| `get_project_evidence` | missing-evidence + media count |
| `get_project_risks` | `getTopRiskInsights` |
| `calculate_project_health` | `getProjectHealthScore` → GREEN/AMBER/RED |
| `find_project_blockers` | task signals + blocking defects + evidence gaps |

Execution mode for all of the above: **READ**. Risk: **LOW**.

## Security

- LLM may only pick names from the allowlist; extras are rejected.
- Workers cannot run `get_project_members`.
- No write skills are registered in Slice 01.
