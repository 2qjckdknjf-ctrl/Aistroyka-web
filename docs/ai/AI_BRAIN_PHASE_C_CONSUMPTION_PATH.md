# AI Brain Phase C — Consumption Path

**Status:** Phase C  
**Date:** 2026-03-23

## Routes

### 1. Action-plan (extended)
POST /api/v1/ai/action-plan — now includes `memory` array in response (summary only)

### 2. Memory context (new)
GET /api/v1/ai/memory/context?projectId=:id&mode=:mode
- Returns relevant memory for project/mode
- Auth: tenant + project membership

### 3. Memory record (new)
POST /api/v1/ai/memory/record
- Body: create params (validated)
- Creates memory record via write policy
- Conservative; rejects unsafe writes
