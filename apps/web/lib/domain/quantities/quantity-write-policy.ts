import type { TenantContext } from "@/lib/tenant/tenant.types";

const WORKER_QUANTITY_KINDS = new Set(["reported", "measured"]);

function isManagerRole(ctx: TenantContext): boolean {
  // canManageTasks/canManageProjects include members — too broad for planned/accepted writes.
  return ctx.role === "owner" || ctx.role === "admin";
}

/**
 * Stage2a A03: managers (owner/admin) may write any quantity_kind; members (workers)
 * may only write reported/measured field captures — never planned/accepted/system_complete.
 */
export function canWriteQuantitySnapshot(
  ctx: TenantContext,
  quantityKind: unknown
): { ok: true } | { ok: false; error: string } {
  if (isManagerRole(ctx)) return { ok: true };

  if (ctx.role !== "member") {
    return { ok: false, error: "Insufficient rights" };
  }

  const kind = typeof quantityKind === "string" ? quantityKind.trim() : "";
  if (!WORKER_QUANTITY_KINDS.has(kind)) {
    return {
      ok: false,
      error: "Workers may only write reported or measured quantity snapshots",
    };
  }
  return { ok: true };
}

export function isWorkerQuantityKind(value: unknown): boolean {
  return typeof value === "string" && WORKER_QUANTITY_KINDS.has(value.trim());
}
