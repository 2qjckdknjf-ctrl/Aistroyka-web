import { describe, it, expect, vi, beforeEach } from "vitest";
import { getWorkspaceSetupState } from "./setup-continuation.service";
import * as evaluator from "./setup-readiness.evaluator";

vi.mock("./setup-readiness.evaluator");

const supabase = {} as import("@supabase/supabase-js").SupabaseClient;

describe("getWorkspaceSetupState", () => {
  beforeEach(() => {
    vi.mocked(evaluator.evaluateSetupReadinessV2).mockResolvedValue({
      kind: "setup_incomplete",
      projectCount: 0,
      completedSteps: [],
      missingSteps: ["first_project_created", "workspace_name_set", "has_invited_or_collaborator"],
      nextActionKey: "create_first_project",
      targetRoute: "/projects/new",
    });
  });

  it("returns setup state from evaluator", async () => {
    const state = await getWorkspaceSetupState(supabase, "ws-1");

    expect(evaluator.evaluateSetupReadinessV2).toHaveBeenCalledWith(supabase, "ws-1");
    expect(state.readiness.kind).toBe("setup_incomplete");
    expect(state.completedSteps).toEqual([]);
    expect(state.missingSteps).toEqual([
      "first_project_created",
      "workspace_name_set",
      "has_invited_or_collaborator",
    ]);
    expect(state.nextActionKey).toBe("create_first_project");
    expect(state.targetRoute).toBe("/projects/new");
  });

  it("returns ready_for_dashboard when evaluator says so", async () => {
    vi.mocked(evaluator.evaluateSetupReadinessV2).mockResolvedValue({
      kind: "ready_for_dashboard",
      projectCount: 2,
      completedSteps: ["first_project_created", "workspace_name_set", "has_invited_or_collaborator"],
      missingSteps: [],
      nextActionKey: "open_dashboard",
      targetRoute: "/dashboard",
    });

    const state = await getWorkspaceSetupState(supabase, "ws-2");

    expect(state.readiness.kind).toBe("ready_for_dashboard");
    expect(state.completedSteps).toHaveLength(3);
    expect(state.missingSteps).toEqual([]);
    expect(state.nextActionKey).toBe("open_dashboard");
    expect(state.targetRoute).toBe("/dashboard");
  });

  it("returns minimally_ready with partial steps", async () => {
    vi.mocked(evaluator.evaluateSetupReadinessV2).mockResolvedValue({
      kind: "minimally_ready",
      projectCount: 1,
      completedSteps: ["first_project_created", "workspace_name_set"],
      missingSteps: ["has_invited_or_collaborator"],
      nextActionKey: "invite_team",
      targetRoute: "/team",
    });

    const state = await getWorkspaceSetupState(supabase, "ws-3");

    expect(state.readiness.kind).toBe("minimally_ready");
    expect(state.completedSteps).toEqual(["first_project_created", "workspace_name_set"]);
    expect(state.missingSteps).toEqual(["has_invited_or_collaborator"]);
    expect(state.nextActionKey).toBe("invite_team");
    expect(state.targetRoute).toBe("/team");
  });
});
