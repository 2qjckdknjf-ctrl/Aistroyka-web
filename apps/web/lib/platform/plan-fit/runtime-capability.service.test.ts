import { describe, expect, it } from "vitest";
import {
  getWorkspaceCapabilitiesFromRuntime,
  requireWorkspaceCapability,
  WorkspaceCapabilityRequiredError,
} from "./runtime-capability.service";
import type { WorkspacePlanRuntimeAdapter } from "./runtime-adapter.types";
import type { WorkspacePlanRuntimeSource } from "./runtime-source.types";
import type { SupabaseClient } from "@supabase/supabase-js";

const noopSupabase = {} as SupabaseClient;

function createAdapter(source: WorkspacePlanRuntimeSource): WorkspacePlanRuntimeAdapter {
  return {
    async getRuntimeSource(_, workspaceId) {
      return { ...source, workspaceId: source.workspaceId || workspaceId };
    },
  };
}

describe("getWorkspaceCapabilitiesFromRuntime", () => {
  it("returns consistent snapshot from runtime with legacy PRO", async () => {
    const adapter = createAdapter({ workspaceId: "ws-1", legacyTier: "PRO" });
    const snap = await getWorkspaceCapabilitiesFromRuntime(noopSupabase, "ws-1", { adapter });
    expect(snap.limits.maxUsers).toBe(20);
    expect(snap.limits.maxProjects).toBe(15);
    expect(snap.capabilities.tasks).toBe(true);
    expect(snap.capabilities.managerAi).toBe(true);
    expect(snap.capabilities.sso).toBe(false);
  });

  it("returns snapshot from runtime with safe default when no tier", async () => {
    const adapter = createAdapter({ workspaceId: "ws-2" });
    const snap = await getWorkspaceCapabilitiesFromRuntime(noopSupabase, "ws-2", { adapter });
    expect(snap.limits.maxUsers).toBe(2);
    expect(snap.capabilities.portfolioAnalytics).toBe(false);
  });

  it("returns enterprise capabilities when legacy ENTERPRISE", async () => {
    const adapter = createAdapter({ workspaceId: "ws-3", legacyTier: "ENTERPRISE" });
    const snap = await getWorkspaceCapabilitiesFromRuntime(noopSupabase, "ws-3", { adapter });
    expect(snap.capabilities.sso).toBe(true);
    expect(snap.capabilities.auditLogs).toBe(true);
  });
});

describe("requireWorkspaceCapability", () => {
  it("returns snapshot when capability is true", async () => {
    const adapter = createAdapter({ workspaceId: "ws-4", legacyTier: "PRO" });
    const snap = await requireWorkspaceCapability(
      noopSupabase,
      "ws-4",
      "managerAi",
      { adapter }
    );
    expect(snap.capabilities.managerAi).toBe(true);
  });

  it("throws WorkspaceCapabilityRequiredError when capability is false", async () => {
    const adapter = createAdapter({ workspaceId: "ws-5", legacyTier: "FREE" });
    await expect(
      requireWorkspaceCapability(noopSupabase, "ws-5", "sso", { adapter })
    ).rejects.toThrow(WorkspaceCapabilityRequiredError);
    await expect(
      requireWorkspaceCapability(noopSupabase, "ws-5", "sso", { adapter })
    ).rejects.toMatchObject({ capabilityKey: "sso" });
  });
});
