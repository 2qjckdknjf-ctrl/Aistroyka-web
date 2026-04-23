# AI Brain Tool Registry — Phase A

**Status:** Phase A  
**Date:** 2026-03-22

## Tool Adapters (Read-Only)

| Tool ID | Adapter | Availability |
|---------|---------|--------------|
| get_project_truth_snapshot | Returns snapshot from assembler | Always (already loaded) |
| get_project_health_summary | getProjectHealth / getProjectHealthScore | Real |
| get_top_risks_summary | getTopRiskInsights | Real |
| get_missing_evidence_summary | getMissingEvidenceInsights | Real |
| get_recent_activity_summary | report signals + snapshot | Real |
| get_schedule_summary_if_available | milestone-pressure, schedule-pressure | Partial |
| get_approvals_summary_if_available | project-summary.pendingDecisionsCount | Real |
| get_documents_summary_if_available | Same as approvals | Real |
| get_budget_summary_if_available | cost-signals | Partial |

## Rules

1. Reuse existing services
2. Return explicit availability/degradation metadata when partial
3. Do not silently swallow missing modules
4. No write tools in Phase A
