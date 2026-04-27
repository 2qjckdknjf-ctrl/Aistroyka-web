import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getWorkspacePilotStatus, isWorkspaceInPilotCohortSync } from "./billing-pilot.repository";

vi.mock("./billing-pilot-cohort.repository", () => ({
  getBillingPilotWorkspaceByWorkspaceId: vi.fn(),
}));

const { getBillingPilotWorkspaceByWorkspaceId } = await import("./billing-pilot-cohort.repository");
const noopSupabase = {} as SupabaseClient;
const ENV_KEY = "BILLING_PILOT_WORKSPACE_IDS";

describe("billing-pilot.repository (Step 18, Step 19)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env[ENV_KEY];
    vi.mocked(getBillingPilotWorkspaceByWorkspaceId).mockResolvedValue(null);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("getWorkspacePilotStatus", () => {
    it("returns inCohort false when allowlist empty", async () => {
      const result = await getWorkspacePilotStatus(noopSupabase, "w1");
      expect(result.inCohort).toBe(false);
      expect(result.liveCheckoutEnabled).toBe(false);
      expect(result.webhookProcessingEnabled).toBe(false);
      expect(result.source).toBe("none");
    });

    it("returns inCohort true when workspace in allowlist", async () => {
      process.env[ENV_KEY] = "w1,w2,w3";
      const result = await getWorkspacePilotStatus(noopSupabase, "w1");
      expect(result.inCohort).toBe(true);
      expect(result.liveCheckoutEnabled).toBe(true);
      expect(result.webhookProcessingEnabled).toBe(true);
      expect(result.source).toBe("env");
    });

    it("returns inCohort false when workspace not in allowlist", async () => {
      process.env[ENV_KEY] = "w1,w2";
      const result = await getWorkspacePilotStatus(noopSupabase, "w99");
      expect(result.inCohort).toBe(false);
    });

    it("trims whitespace in allowlist", async () => {
      process.env[ENV_KEY] = "  w1 , w2  ";
      const result = await getWorkspacePilotStatus(noopSupabase, "w1");
      expect(result.inCohort).toBe(true);
    });

    it("Step 19: DB overrides env when workspace in DB", async () => {
      process.env[ENV_KEY] = "w1";
      vi.mocked(getBillingPilotWorkspaceByWorkspaceId).mockResolvedValue({
        workspaceId: "w1",
        liveCheckoutEnabled: false,
        webhookProcessingEnabled: true,
        cohortLabel: "test",
        notes: null,
        enabledBy: null,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      });
      const result = await getWorkspacePilotStatus(noopSupabase, "w1");
      expect(result.inCohort).toBe(true);
      expect(result.source).toBe("db");
      expect(result.liveCheckoutEnabled).toBe(false);
      expect(result.webhookProcessingEnabled).toBe(true);
    });
  });

  describe("isWorkspaceInPilotCohortSync", () => {
    it("returns false when allowlist empty", () => {
      expect(isWorkspaceInPilotCohortSync("w1")).toBe(false);
    });
    it("returns true when workspace in allowlist", () => {
      process.env[ENV_KEY] = "w1";
      expect(isWorkspaceInPilotCohortSync("w1")).toBe(true);
    });
    it("returns false when workspace not in allowlist", () => {
      process.env[ENV_KEY] = "w1,w2";
      expect(isWorkspaceInPilotCohortSync("w3")).toBe(false);
    });
  });
});
