import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { canSoftDeleteTaskMessage, isTaskChatManager } from "./task-messages.policy";
import type { TenantContext } from "@/lib/tenant/tenant.types";

const migration = readFileSync(
  join(
    __dirname,
    "../../../supabase/migrations/20260721110527_restrict_task_chat_manager_access.sql"
  ),
  "utf8"
);

function context(role: TenantContext["role"], userId = "user-1"): TenantContext {
  return {
    tenantId: "tenant-1",
    userId,
    role,
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "trace-1",
  };
}

describe("task chat authorization", () => {
  it("does not treat field-worker members as managers", () => {
    expect(isTaskChatManager(context("member"))).toBe(false);
    expect(isTaskChatManager(context("admin"))).toBe(true);
    expect(isTaskChatManager(context("owner"))).toBe(true);
  });

  it("only lets members soft-delete messages they sent", () => {
    expect(canSoftDeleteTaskMessage(context("member"), "user-1")).toBe(true);
    expect(canSoftDeleteTaskMessage(context("member"), "manager-1")).toBe(false);
  });

  it("restricts broad RLS access to owner and admin roles", () => {
    const managerRoleChecks = migration.match(/tm\.role in \([^)]+\)/g) ?? [];

    expect(managerRoleChecks).toEqual([
      "tm.role in ('owner', 'admin')",
      "tm.role in ('owner', 'admin')",
    ]);
    expect(migration).toContain("wt.assigned_to = (select auth.uid())");
    expect(migration).toContain("ta.user_id = (select auth.uid())");
  });
});
