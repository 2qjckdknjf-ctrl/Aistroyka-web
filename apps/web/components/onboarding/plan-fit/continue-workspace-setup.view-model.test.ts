import { describe, it, expect } from "vitest";
import {
  getTargetRouteForAction,
  getPrimaryCtaForSetup,
  getSetupProgressViewModel,
  getSetupChecklistViewModel,
  getStepButtonLabelKey,
  getContinueSetupSubtitleKey,
} from "./continue-workspace-setup.view-model";

describe("getTargetRouteForAction", () => {
  it("returns /projects/new for create_first_project", () => {
    expect(getTargetRouteForAction("create_first_project")).toBe("/projects/new");
  });

  it("returns /team for set_workspace_name", () => {
    expect(getTargetRouteForAction("set_workspace_name")).toBe("/team");
  });

  it("returns /team for invite_team", () => {
    expect(getTargetRouteForAction("invite_team")).toBe("/team");
  });

  it("returns /dashboard for open_dashboard", () => {
    expect(getTargetRouteForAction("open_dashboard")).toBe("/dashboard");
  });

  it("returns null for none", () => {
    expect(getTargetRouteForAction("none")).toBe(null);
  });
});

describe("getPrimaryCtaForSetup", () => {
  it("missing first_project_created: primary CTA leads to /projects/new", () => {
    const setup = {
      kind: "setup_missing" as const,
      projectCount: 0,
      completedSteps: [] as string[],
      missingSteps: ["first_project_created", "workspace_name_set", "has_invited_or_collaborator"],
      nextActionKey: "create_first_project" as const,
      targetRoute: "/projects/new",
    };
    const cta = getPrimaryCtaForSetup(setup);
    expect(cta.href).toBe("/projects/new");
    expect(cta.labelKey).toBe("createProject");
    expect(cta.isOpenDashboard).toBe(false);
  });

  it("missing workspace_name_set: primary CTA leads to /team", () => {
    const setup = {
      kind: "minimally_ready" as const,
      projectCount: 1,
      completedSteps: ["first_project_created"],
      missingSteps: ["workspace_name_set", "has_invited_or_collaborator"],
      nextActionKey: "set_workspace_name" as const,
      targetRoute: "/team",
    };
    const cta = getPrimaryCtaForSetup(setup);
    expect(cta.href).toBe("/team");
    expect(cta.labelKey).toBe("teamSettings");
    expect(cta.isOpenDashboard).toBe(false);
  });

  it("missing has_invited_or_collaborator: primary CTA leads to /team", () => {
    const setup = {
      kind: "minimally_ready" as const,
      projectCount: 1,
      completedSteps: ["first_project_created", "workspace_name_set"],
      missingSteps: ["has_invited_or_collaborator"],
      nextActionKey: "invite_team" as const,
      targetRoute: "/team",
    };
    const cta = getPrimaryCtaForSetup(setup);
    expect(cta.href).toBe("/team");
    expect(cta.labelKey).toBe("inviteTeam");
    expect(cta.isOpenDashboard).toBe(false);
  });

  it("setup fully ready / nextActionKey open_dashboard: CTA leads to /dashboard", () => {
    const setup = {
      kind: "ready_for_dashboard" as const,
      projectCount: 2,
      completedSteps: ["first_project_created", "workspace_name_set", "has_invited_or_collaborator"],
      missingSteps: [],
      nextActionKey: "open_dashboard" as const,
      targetRoute: "/dashboard",
    };
    const cta = getPrimaryCtaForSetup(setup);
    expect(cta.href).toBe("/dashboard");
    expect(cta.labelKey).toBe("openDashboard");
    expect(cta.isOpenDashboard).toBe(true);
  });

  it("setup null: safe fallback CTA to /projects/new", () => {
    const cta = getPrimaryCtaForSetup(null);
    expect(cta.href).toBe("/projects/new");
    expect(cta.labelKey).toBe("createProject");
    expect(cta.isOpenDashboard).toBe(false);
  });

  it("setup undefined: safe fallback CTA to /projects/new", () => {
    const cta = getPrimaryCtaForSetup(undefined);
    expect(cta.href).toBe("/projects/new");
    expect(cta.labelKey).toBe("createProject");
  });

  it("setup partial (targetRoute null): uses getTargetRouteForAction fallback", () => {
    const setup = {
      kind: "setup_incomplete" as const,
      projectCount: 0,
      completedSteps: [],
      missingSteps: ["first_project_created", "workspace_name_set", "has_invited_or_collaborator"],
      nextActionKey: "create_first_project" as const,
      targetRoute: null,
    };
    const cta = getPrimaryCtaForSetup(setup);
    expect(cta.href).toBe("/projects/new");
  });

  it("nextActionKey none: CTA leads to /dashboard", () => {
    const setup = {
      kind: "ready_for_dashboard" as const,
      projectCount: 1,
      completedSteps: ["first_project_created", "workspace_name_set", "has_invited_or_collaborator"],
      missingSteps: [],
      nextActionKey: "none" as const,
      targetRoute: null,
    };
    const cta = getPrimaryCtaForSetup(setup);
    expect(cta.href).toBe("/dashboard");
    expect(cta.isOpenDashboard).toBe(true);
  });
});

describe("getSetupProgressViewModel", () => {
  it("completed and missing steps correctly passed to view model", () => {
    const setup = {
      kind: "minimally_ready" as const,
      projectCount: 1,
      completedSteps: ["first_project_created", "workspace_name_set"],
      missingSteps: ["has_invited_or_collaborator"],
      nextActionKey: "invite_team" as const,
      targetRoute: "/team",
    };
    const vm = getSetupProgressViewModel(setup);
    expect(vm.completedSteps).toEqual(["first_project_created", "workspace_name_set"]);
    expect(vm.missingSteps).toEqual(["has_invited_or_collaborator"]);
  });

  it("setup null: empty arrays", () => {
    const vm = getSetupProgressViewModel(null);
    expect(vm.completedSteps).toEqual([]);
    expect(vm.missingSteps).toEqual([]);
  });

  it("setup undefined: empty arrays", () => {
    const vm = getSetupProgressViewModel(undefined);
    expect(vm.completedSteps).toEqual([]);
    expect(vm.missingSteps).toEqual([]);
  });

  it("setup fully ready: all completed, none missing", () => {
    const setup = {
      kind: "ready_for_dashboard" as const,
      projectCount: 2,
      completedSteps: ["first_project_created", "workspace_name_set", "has_invited_or_collaborator"],
      missingSteps: [],
      nextActionKey: "open_dashboard" as const,
      targetRoute: "/dashboard",
    };
    const vm = getSetupProgressViewModel(setup);
    expect(vm.completedSteps).toHaveLength(3);
    expect(vm.missingSteps).toEqual([]);
  });
});

describe("getSetupChecklistViewModel", () => {
  it("returns ordered steps with completed and isRecommended", () => {
    const setup = {
      kind: "minimally_ready" as const,
      projectCount: 1,
      completedSteps: ["first_project_created"],
      missingSteps: ["workspace_name_set", "has_invited_or_collaborator"],
      nextActionKey: "set_workspace_name" as const,
      targetRoute: "/team",
    };
    const checklist = getSetupChecklistViewModel(setup);
    expect(checklist).toHaveLength(3);
    expect(checklist[0].key).toBe("workspace_name_set");
    expect(checklist[0].completed).toBe(false);
    expect(checklist[0].isRecommended).toBe(true);
    expect(checklist[0].route).toBe("/team");
    expect(checklist[1].key).toBe("first_project_created");
    expect(checklist[1].completed).toBe(true);
    expect(checklist[1].isRecommended).toBe(false);
    expect(checklist[2].key).toBe("has_invited_or_collaborator");
    expect(checklist[2].completed).toBe(false);
    expect(checklist[2].isRecommended).toBe(false);
  });

  it("create_first_project recommended when no project", () => {
    const setup = {
      kind: "setup_missing" as const,
      projectCount: 0,
      completedSteps: [],
      missingSteps: ["first_project_created", "workspace_name_set", "has_invited_or_collaborator"],
      nextActionKey: "create_first_project" as const,
      targetRoute: "/projects/new",
    };
    const checklist = getSetupChecklistViewModel(setup);
    const projectStep = checklist.find((s) => s.key === "first_project_created");
    expect(projectStep?.isRecommended).toBe(true);
    expect(projectStep?.route).toBe("/projects/new");
  });

  it("invite_team recommended when project and name done", () => {
    const setup = {
      kind: "minimally_ready" as const,
      projectCount: 1,
      completedSteps: ["first_project_created", "workspace_name_set"],
      missingSteps: ["has_invited_or_collaborator"],
      nextActionKey: "invite_team" as const,
      targetRoute: "/team",
    };
    const checklist = getSetupChecklistViewModel(setup);
    const inviteStep = checklist.find((s) => s.key === "has_invited_or_collaborator");
    expect(inviteStep?.isRecommended).toBe(true);
    expect(inviteStep?.route).toBe("/team");
  });

  it("no step recommended when open_dashboard", () => {
    const setup = {
      kind: "ready_for_dashboard" as const,
      projectCount: 2,
      completedSteps: ["first_project_created", "workspace_name_set", "has_invited_or_collaborator"],
      missingSteps: [],
      nextActionKey: "open_dashboard" as const,
      targetRoute: "/dashboard",
    };
    const checklist = getSetupChecklistViewModel(setup);
    expect(checklist.every((s) => s.completed)).toBe(true);
    expect(checklist.some((s) => s.isRecommended)).toBe(false);
  });

  it("fallback when setup null", () => {
    const checklist = getSetupChecklistViewModel(null);
    expect(checklist).toHaveLength(3);
    expect(checklist.every((s) => !s.completed)).toBe(true);
    const projectStep = checklist.find((s) => s.key === "first_project_created");
    expect(projectStep?.isRecommended).toBe(true);
  });
});

describe("getStepButtonLabelKey", () => {
  it("returns teamSettings for workspace_name_set", () => {
    expect(getStepButtonLabelKey("workspace_name_set")).toBe("teamSettings");
  });
  it("returns createProject for first_project_created", () => {
    expect(getStepButtonLabelKey("first_project_created")).toBe("createProject");
  });
  it("returns inviteTeam for has_invited_or_collaborator", () => {
    expect(getStepButtonLabelKey("has_invited_or_collaborator")).toBe("inviteTeam");
  });
  it("returns createProject for unknown key", () => {
    expect(getStepButtonLabelKey("unknown")).toBe("createProject");
  });
});

describe("getContinueSetupSubtitleKey", () => {
  it("returns continueSetupReadySubtitle when all complete", () => {
    const checklist = [
      { key: "a", completed: true, isRecommended: false } as const,
      { key: "b", completed: true, isRecommended: false } as const,
    ];
    expect(getContinueSetupSubtitleKey(checklist)).toBe("continueSetupReadySubtitle");
  });
  it("returns continueSetupSubtitle when any incomplete", () => {
    const checklist = [
      { key: "a", completed: true, isRecommended: false } as const,
      { key: "b", completed: false, isRecommended: true } as const,
    ];
    expect(getContinueSetupSubtitleKey(checklist)).toBe("continueSetupSubtitle");
  });
  it("returns continueSetupSubtitle for empty checklist", () => {
    expect(getContinueSetupSubtitleKey([])).toBe("continueSetupSubtitle");
  });
});

describe("Step 8: profile-first scenario", () => {
  it("profile-first: next step = fill workspace name, CTA and recommended step correct", () => {
    const setup = {
      kind: "minimally_ready" as const,
      projectCount: 1,
      completedSteps: ["first_project_created"],
      missingSteps: ["workspace_name_set", "has_invited_or_collaborator"],
      nextActionKey: "set_workspace_name" as const,
      targetRoute: "/team",
    };
    const cta = getPrimaryCtaForSetup(setup);
    const checklist = getSetupChecklistViewModel(setup);
    expect(cta.href).toBe("/team");
    expect(cta.labelKey).toBe("teamSettings");
    const profileStep = checklist.find((s) => s.key === "workspace_name_set");
    expect(profileStep?.isRecommended).toBe(true);
    expect(profileStep?.route).toBe("/team");
  });
});

describe("Step 8: project-first scenario", () => {
  it("project-first: profile exists, no project, CTA leads to /projects/new", () => {
    const setup = {
      kind: "setup_incomplete" as const,
      projectCount: 0,
      completedSteps: ["workspace_name_set"],
      missingSteps: ["first_project_created", "has_invited_or_collaborator"],
      nextActionKey: "create_first_project" as const,
      targetRoute: "/projects/new",
    };
    const cta = getPrimaryCtaForSetup(setup);
    const checklist = getSetupChecklistViewModel(setup);
    expect(cta.href).toBe("/projects/new");
    expect(cta.labelKey).toBe("createProject");
    const projectStep = checklist.find((s) => s.key === "first_project_created");
    expect(projectStep?.isRecommended).toBe(true);
    expect(projectStep?.route).toBe("/projects/new");
  });
});

describe("Step 8: team/invite scenario", () => {
  it("team/invite: profile and project done, CTA leads to /team", () => {
    const setup = {
      kind: "minimally_ready" as const,
      projectCount: 1,
      completedSteps: ["first_project_created", "workspace_name_set"],
      missingSteps: ["has_invited_or_collaborator"],
      nextActionKey: "invite_team" as const,
      targetRoute: "/team",
    };
    const cta = getPrimaryCtaForSetup(setup);
    const checklist = getSetupChecklistViewModel(setup);
    expect(cta.href).toBe("/team");
    expect(cta.labelKey).toBe("inviteTeam");
    const inviteStep = checklist.find((s) => s.key === "has_invited_or_collaborator");
    expect(inviteStep?.isRecommended).toBe(true);
    expect(inviteStep?.route).toBe("/team");
  });
});

describe("Step 8: dashboard-ready safety", () => {
  it("dashboard-ready: fully ready path leads to dashboard, no setup CTA overrides", () => {
    const setup = {
      kind: "ready_for_dashboard" as const,
      projectCount: 2,
      completedSteps: ["first_project_created", "workspace_name_set", "has_invited_or_collaborator"],
      missingSteps: [],
      nextActionKey: "open_dashboard" as const,
      targetRoute: "/dashboard",
    };
    const cta = getPrimaryCtaForSetup(setup);
    const checklist = getSetupChecklistViewModel(setup);
    expect(cta.href).toBe("/dashboard");
    expect(cta.isOpenDashboard).toBe(true);
    expect(checklist.some((s) => s.isRecommended)).toBe(false);
    expect(getContinueSetupSubtitleKey(checklist)).toBe("continueSetupReadySubtitle");
  });
});

describe("Step 8: fallback with partial/unavailable setup data", () => {
  it("fallback: null setup yields safe CTA and valid checklist", () => {
    const cta = getPrimaryCtaForSetup(null);
    const checklist = getSetupChecklistViewModel(null);
    expect(cta.href).toBe("/projects/new");
    expect(cta.labelKey).toBe("createProject");
    expect(checklist).toHaveLength(3);
    expect(checklist.every((s) => s.route)).toBe(true);
  });
  it("fallback: undefined setup yields safe CTA", () => {
    const cta = getPrimaryCtaForSetup(undefined);
    expect(cta.href).toBe("/projects/new");
  });
  it("fallback: partial setup (missing targetRoute) uses route from action", () => {
    const setup = {
      kind: "setup_incomplete" as const,
      projectCount: 0,
      completedSteps: [],
      missingSteps: ["first_project_created", "workspace_name_set", "has_invited_or_collaborator"],
      nextActionKey: "create_first_project" as const,
      targetRoute: null,
    };
    const cta = getPrimaryCtaForSetup(setup);
    expect(cta.href).toBe("/projects/new");
  });
});

describe("Step 8: screen-level mapping", () => {
  it("completed/missing/recommended steps built correctly for improved screen", () => {
    const setup = {
      kind: "minimally_ready" as const,
      projectCount: 1,
      completedSteps: ["workspace_name_set"],
      missingSteps: ["first_project_created", "has_invited_or_collaborator"],
      nextActionKey: "create_first_project" as const,
      targetRoute: "/projects/new",
    };
    const checklist = getSetupChecklistViewModel(setup);
    expect(checklist[0].key).toBe("workspace_name_set");
    expect(checklist[0].completed).toBe(true);
    expect(checklist[0].isRecommended).toBe(false);
    expect(checklist[1].key).toBe("first_project_created");
    expect(checklist[1].completed).toBe(false);
    expect(checklist[1].isRecommended).toBe(true);
    expect(checklist[2].key).toBe("has_invited_or_collaborator");
    expect(checklist[2].completed).toBe(false);
    expect(checklist[2].isRecommended).toBe(false);
    expect(checklist.every((s) => s.labelKey && s.descriptionKey && s.route)).toBe(true);
  });
});
