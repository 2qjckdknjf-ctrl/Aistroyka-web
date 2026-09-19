/**
 * Construction Graph repository — tenant + project scoped, idempotent source bind.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConstructionEntityType, ConstructionRelationType, ConstructionSourceType } from "./construction-context";

export interface ConstructionEntityRow {
  id: string;
  tenant_id: string;
  project_id: string;
  entity_type: ConstructionEntityType;
  source_type: ConstructionSourceType;
  source_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ConstructionRelationRow {
  id: string;
  tenant_id: string;
  project_id: string;
  from_entity_id: string;
  relation_type: ConstructionRelationType;
  to_entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export async function bindSourceEntity(
  supabase: SupabaseClient,
  input: {
    tenantId: string;
    projectId: string;
    entityType: ConstructionEntityType;
    sourceType: ConstructionSourceType;
    sourceId: string;
    metadata?: Record<string, unknown>;
  }
): Promise<ConstructionEntityRow | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("construction_entities")
    .upsert(
      {
        tenant_id: input.tenantId,
        project_id: input.projectId,
        entity_type: input.entityType,
        source_type: input.sourceType,
        source_id: input.sourceId,
        metadata: input.metadata ?? {},
        updated_at: now,
      },
      { onConflict: "tenant_id,project_id,source_type,source_id" }
    )
    .select("id, tenant_id, project_id, entity_type, source_type, source_id, metadata, created_at, updated_at")
    .maybeSingle();
  if (error || !data) return null;
  return data as ConstructionEntityRow;
}

export async function bindRelation(
  supabase: SupabaseClient,
  input: {
    tenantId: string;
    projectId: string;
    fromEntityId: string;
    relationType: ConstructionRelationType;
    toEntityId: string;
    metadata?: Record<string, unknown>;
  }
): Promise<ConstructionRelationRow | null> {
  const { data, error } = await supabase
    .from("construction_relations")
    .upsert(
      {
        tenant_id: input.tenantId,
        project_id: input.projectId,
        from_entity_id: input.fromEntityId,
        relation_type: input.relationType,
        to_entity_id: input.toEntityId,
        metadata: input.metadata ?? {},
      },
      { onConflict: "tenant_id,project_id,from_entity_id,relation_type,to_entity_id" }
    )
    .select("id, tenant_id, project_id, from_entity_id, relation_type, to_entity_id, metadata, created_at")
    .maybeSingle();
  if (error || !data) return null;
  return data as ConstructionRelationRow;
}

export async function listProjectEntities(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  limit = 50
): Promise<ConstructionEntityRow[]> {
  const { data, error } = await supabase
    .from("construction_entities")
    .select("id, tenant_id, project_id, entity_type, source_type, source_id, metadata, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as ConstructionEntityRow[];
}
