# AI Brain Output Contracts — Phase A

**Status:** Phase A  
**Date:** 2026-03-22

## Contracts

### 1. ExecutiveProjectBrief
- facts: object
- inferredStatements: string[]
- unavailableData: string[]
- confidenceNote: string | null
- recommendedNextAttention: string | null
- headline: string
- projectId, tenantId, at, projectStatus

### 2. ManagerProjectInsight
- facts: object
- inferredStatements: string[]
- unavailableData: string[]
- confidenceNote: string | null
- recommendedNextAttention: string | null
- projectId, tenantId, at, projectStatus

### 3. WorkerNextFocusSummary
- facts: object
- inferredStatements: string[]
- unavailableData: string[]
- recommendedNextAttention: string | null
- projectId, tenantId, at, projectStatus

### 4. ClientSafeProjectSummary
- headline: string
- facts: object (sanitized)
- inferredStatements: string[]
- unavailableData: string[]
- confidenceNote: string | null
- recommendedNextAttention: string | null
- projectId, tenantId, at, projectStatus

## Validation
- Use Zod schemas in apps/web/lib/ai-brain/phase-a/contracts/
- Repair/reject behavior: strict parse, on fail return error shape
