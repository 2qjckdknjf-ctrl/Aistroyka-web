# AI Brain Phase C — Storage Spec

**Status:** Phase C  
**Date:** 2026-03-23

## Table: ai_memory_records

- id, tenant_id, project_id (nullable), user_id (nullable)
- memory_type, scope, source_kind, source_ref (nullable)
- title, body (jsonb)
- facts_used (text[]), grounding_refs (text[])
- confidence, expires_at (nullable), status
- superseded_by (nullable)
- created_at, updated_at

## Indexes

- tenant_id, project_id, memory_type, status
- tenant_id, user_id, memory_type
- tenant_id, expires_at (for cleanup)

## RLS

- tenant_members check for select/insert/update
- Writes via service role or authenticated tenant member

## Lifecycle

- active → stale (time), superseded (manual), expired (ttl), rejected (policy)
