# AI Brain Phase C — Memory Service Spec

**Status:** Phase C  
**Date:** 2026-03-23

## Operations

- createMemoryRecord
- getRelevantMemory
- getProjectWorkingMemory (filter: project_working, projectId)
- getUserPreferenceMemory (filter: user_preference, userId)
- getSessionMemory (filter: session, runId)
- markMemorySuperseded
- expireMemory

## Rules

- Validate every write
- Validate scope on read/write
- Reject unsafe or weakly attributable records
- No cross-tenant leakage
- Retrieval supports degradation
