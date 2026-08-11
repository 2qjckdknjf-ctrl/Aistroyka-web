# Gold Memory pgvector Decision

**Date:** 2026-06-17  
**Classification:** **OUT_OF_SCOPE_FOR_MVP**

## Evidence

| Check | Result |
|-------|--------|
| pgvector extension installed on AISTROYKA | **NO** |
| pgvector in repo migrations | **NO** |
| jsonb `embedding_json` MVP implemented | **YES** |
| In-app cosine similarity retrieval | **YES** |

## Decision statement

**pgvector is OUT_OF_SCOPE_FOR_MVP and does not block Gold Memory MVP closure** because `embedding_json` jsonb is sufficient for low-volume staging/pilot validation. **pgvector becomes required before high-volume production retrieval** (IVFFlat/HNSW index, database-side similarity).

## Scale backlog trigger

- \> ~5k gold rows per tenant, or
- p95 retrieval latency exceeds Copilot stream budget, or
- need for ANN index / hybrid search

## This sprint

Do **not** enable pgvector extension or change storage model.
