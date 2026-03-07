/**
 * Annotation service - handles photo annotations.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { getAdminClient } from "@/lib/supabase/admin";
import * as repo from "./annotation.repository";
import { emitChange } from "@/lib/sync/change-log.repository";
import type { PhotoAnnotation } from "./annotation.repository";

export async function createAnnotation(
  supabase: SupabaseClient,
  ctx: TenantContext,
  mediaId: string,
  type: string,
  data: Record<string, unknown>
): Promise<{ data: PhotoAnnotation | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) {
    return { data: null, error: "Unauthorized" };
  }

  if (!type || typeof type !== "string" || !type.trim()) {
    return { data: null, error: "type required" };
  }

  const annotation = await repo.createAnnotation(
    supabase,
    ctx.tenantId,
    mediaId,
    ctx.userId,
    type.trim(),
    data && typeof data === "object" ? data : {}
  );

  if (!annotation) {
    return { data: null, error: "Failed to create annotation" };
  }

  // Emit change-log event for sync
  const admin = getAdminClient();
  if (admin) {
    await emitChange(admin, {
      tenant_id: ctx.tenantId,
      resource_type: "media",
      resource_id: mediaId,
      change_type: "updated",
      changed_by: ctx.userId,
      payload: { annotation_id: annotation.id },
    });
  }

  return { data: annotation, error: "" };
}

export async function getAnnotation(
  supabase: SupabaseClient,
  ctx: TenantContext,
  annotationId: string
): Promise<{ data: PhotoAnnotation | null; error: string }> {
  if (!ctx.tenantId) {
    return { data: null, error: "Unauthorized" };
  }

  const annotation = await repo.getAnnotationById(supabase, annotationId, ctx.tenantId);
  if (!annotation) {
    return { data: null, error: "Annotation not found" };
  }

  return { data: annotation, error: "" };
}

export async function updateAnnotation(
  supabase: SupabaseClient,
  ctx: TenantContext,
  mediaId: string,
  annotationId: string,
  expectedVersion: number,
  updates: { type?: string; data?: Record<string, unknown> }
): Promise<{ data: PhotoAnnotation | null; error: string; statusCode?: number }> {
  if (!ctx.tenantId) {
    return { data: null, error: "Unauthorized" };
  }

  // Check current version
  const existing = await repo.getAnnotationById(supabase, annotationId, ctx.tenantId);
  if (!existing) {
    return { data: null, error: "Not found", statusCode: 404 };
  }

  if (existing.media_id !== mediaId) {
    return { data: null, error: "Annotation does not belong to this media", statusCode: 404 };
  }

  if (existing.version !== expectedVersion) {
    return {
      data: null,
      error: "Conflict",
      statusCode: 409,
    };
  }

  // Update annotation
  const updateData: Record<string, unknown> = {};
  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.data !== undefined) updateData.data = updates.data;

  const annotation = await repo.updateAnnotation(supabase, annotationId, ctx.tenantId, updateData);
  if (!annotation) {
    return { data: null, error: "Update failed", statusCode: 409 };
  }

  // Emit change-log event
  const admin = getAdminClient();
  if (admin) {
    await emitChange(admin, {
      tenant_id: ctx.tenantId,
      resource_type: "media",
      resource_id: mediaId,
      change_type: "updated",
      changed_by: ctx.userId,
      payload: { annotation_id: annotationId },
    });
  }

  return { data: annotation, error: "" };
}

export async function deleteAnnotation(
  supabase: SupabaseClient,
  ctx: TenantContext,
  annotationId: string
): Promise<{ ok: boolean; error: string }> {
  if (!ctx.tenantId) {
    return { ok: false, error: "Unauthorized" };
  }

  const ok = await repo.deleteAnnotation(supabase, annotationId, ctx.tenantId);
  if (!ok) {
    return { ok: false, error: "Annotation not found or delete failed" };
  }

  return { ok: true, error: "" };
}

export async function listAnnotations(
  supabase: SupabaseClient,
  ctx: TenantContext,
  mediaId: string
): Promise<{ data: PhotoAnnotation[]; error: string }> {
  if (!ctx.tenantId) {
    return { data: [], error: "Unauthorized" };
  }

  const annotations = await repo.listAnnotationsByMedia(supabase, mediaId, ctx.tenantId);
  return { data: annotations, error: "" };
}
