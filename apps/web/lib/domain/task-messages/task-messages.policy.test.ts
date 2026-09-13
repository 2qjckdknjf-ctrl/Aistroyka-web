import { describe, expect, it } from "vitest";
import type { TenantContext, TenantRoleDb } from "@/lib/tenant/tenant.types";
import {
  canSoftDeleteTaskMessage,
  isTaskChatManager,
} from "./task-messages.policy";

function context(role: TenantRoleDb, userId = "user-1"): TenantContext {
  return {
    tenantId: "tenant-1",
    userId,
    role,
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "trace-1",
  };
}

describe("task message authorization", () => {
  it.each(["owner", "admin"] as const)(
    "allows %s tenant-wide manager access",
    (role) => {
      expect(isTaskChatManager(context(role))).toBe(true);
    }
  );

  it.each(["member", "viewer", "stakeholder"] as const)(
    "does not elevate %s based on a web client profile",
    (role) => {
      expect(isTaskChatManager(context(role))).toBe(false);
    }
  );

  it("allows a worker to soft-delete only their own message", () => {
    const worker = context("member", "worker-1");

    expect(canSoftDeleteTaskMessage(worker, "worker-1")).toBe(true);
    expect(canSoftDeleteTaskMessage(worker, "worker-2")).toBe(false);
  });
});
