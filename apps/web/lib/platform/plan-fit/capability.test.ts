import { describe, expect, it } from "vitest";
import {
  canUseAdvancedApprovals,
  canUseManagerAI,
  canUseSSO,
  hasReachedUserLimit,
  hasReachedProjectLimit,
  hasReachedStorageLimit,
  hasReachedAiLimit,
  canCreateProject,
  canInviteUser,
  canUseMobileWorkerFlow,
  getWorkspaceCapabilities,
} from "./capability";

describe("capability layer", () => {
  describe("getWorkspaceCapabilities", () => {
    it("returns entitlements for planCode when entitlements not provided", () => {
      const out = getWorkspaceCapabilities({ planCode: "team_contractor" });
      expect(out.limits.maxUsers).toBe(20);
      expect(out.capabilities.managerAi).toBe(true);
    });
  });

  describe("canUseAdvancedApprovals", () => {
    it("returns false for client_personal", () => {
      expect(canUseAdvancedApprovals({ planCode: "client_personal" })).toBe(false);
    });
    it("returns false for team_contractor", () => {
      expect(canUseAdvancedApprovals({ planCode: "team_contractor" })).toBe(false);
    });
    it("returns true for business_operations and enterprise", () => {
      expect(canUseAdvancedApprovals({ planCode: "business_operations" })).toBe(true);
      expect(canUseAdvancedApprovals({ planCode: "enterprise" })).toBe(true);
    });
  });

  describe("canUseManagerAI", () => {
    it("returns false for client_personal", () => {
      expect(canUseManagerAI({ planCode: "client_personal" })).toBe(false);
    });
    it("returns true for team_contractor, business_operations, enterprise", () => {
      expect(canUseManagerAI({ planCode: "team_contractor" })).toBe(true);
      expect(canUseManagerAI({ planCode: "business_operations" })).toBe(true);
      expect(canUseManagerAI({ planCode: "enterprise" })).toBe(true);
    });
  });

  describe("canUseSSO", () => {
    it("returns false for client_personal, team_contractor, business_operations", () => {
      expect(canUseSSO({ planCode: "client_personal" })).toBe(false);
      expect(canUseSSO({ planCode: "team_contractor" })).toBe(false);
      expect(canUseSSO({ planCode: "business_operations" })).toBe(false);
    });
    it("returns true for enterprise", () => {
      expect(canUseSSO({ planCode: "enterprise" })).toBe(true);
    });
  });

  describe("hasReachedUserLimit", () => {
    it("returns false when usage not provided", () => {
      expect(hasReachedUserLimit({ planCode: "client_personal" })).toBe(false);
    });
    it("returns true when activeUsersCount >= maxUsers", () => {
      expect(
        hasReachedUserLimit({
          planCode: "client_personal",
          usage: { activeUsersCount: 2, activeProjectsCount: 0, storageUsedGb: 0, aiRequestsCount: 0 },
        })
      ).toBe(true);
      expect(
        hasReachedUserLimit({
          planCode: "client_personal",
          usage: { activeUsersCount: 3, activeProjectsCount: 0, storageUsedGb: 0, aiRequestsCount: 0 },
        })
      ).toBe(true);
    });
    it("returns false when below limit", () => {
      expect(
        hasReachedUserLimit({
          planCode: "client_personal",
          usage: { activeUsersCount: 1, activeProjectsCount: 0, storageUsedGb: 0, aiRequestsCount: 0 },
        })
      ).toBe(false);
    });
  });

  describe("hasReachedProjectLimit", () => {
    it("returns false when usage not provided", () => {
      expect(hasReachedProjectLimit({ planCode: "team_contractor" })).toBe(false);
    });
    it("returns true when activeProjectsCount >= maxProjects", () => {
      expect(
        hasReachedProjectLimit({
          planCode: "team_contractor",
          usage: { activeUsersCount: 0, activeProjectsCount: 15, storageUsedGb: 0, aiRequestsCount: 0 },
        })
      ).toBe(true);
    });
    it("returns false when below limit", () => {
      expect(
        hasReachedProjectLimit({
          planCode: "team_contractor",
          usage: { activeUsersCount: 0, activeProjectsCount: 10, storageUsedGb: 0, aiRequestsCount: 0 },
        })
      ).toBe(false);
    });
  });

  describe("hasReachedStorageLimit", () => {
    it("returns true when storageUsedGb >= maxStorageGb", () => {
      expect(
        hasReachedStorageLimit({
          planCode: "client_personal",
          usage: { activeUsersCount: 0, activeProjectsCount: 0, storageUsedGb: 10, aiRequestsCount: 0 },
        })
      ).toBe(true);
    });
  });

  describe("hasReachedAiLimit", () => {
    it("returns true when aiRequestsCount >= maxMonthlyAiRequests", () => {
      expect(
        hasReachedAiLimit({
          planCode: "client_personal",
          usage: { activeUsersCount: 0, activeProjectsCount: 0, storageUsedGb: 0, aiRequestsCount: 100 },
        })
      ).toBe(true);
    });
  });

  describe("canCreateProject", () => {
    it("respects project limit when usage provided", () => {
      expect(
        canCreateProject({
          planCode: "client_personal",
          usage: { activeUsersCount: 0, activeProjectsCount: 2, storageUsedGb: 0, aiRequestsCount: 0 },
        })
      ).toBe(false);
      expect(
        canCreateProject({
          planCode: "client_personal",
          usage: { activeUsersCount: 0, activeProjectsCount: 1, storageUsedGb: 0, aiRequestsCount: 0 },
        })
      ).toBe(true);
    });
  });

  describe("canInviteUser", () => {
    it("respects user limit when usage provided", () => {
      expect(
        canInviteUser({
          planCode: "client_personal",
          usage: { activeUsersCount: 2, activeProjectsCount: 0, storageUsedGb: 0, aiRequestsCount: 0 },
        })
      ).toBe(false);
    });
  });

  describe("canUseMobileWorkerFlow", () => {
    it("returns false for client_personal (maxActiveMobileWorkers 0)", () => {
      expect(canUseMobileWorkerFlow({ planCode: "client_personal" })).toBe(false);
    });
    it("returns true for team_contractor when no usage", () => {
      expect(canUseMobileWorkerFlow({ planCode: "team_contractor" })).toBe(true);
    });
  });
});
