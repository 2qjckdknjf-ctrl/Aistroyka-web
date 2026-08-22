/**
 * Phase 3 certification bundle — negative tenant isolation cases.
 * Aggregates pure-logic guards that must fail closed for cross-tenant access.
 */

import { describe, expect, it } from "vitest";
import {
  assertMediaPathTenantScope,
  inspectMediaPathScope,
  normalizeMediaObjectPath,
} from "@/lib/platform/ai/media-path-tenant-guard";
import { validateJobsPayloadProjectTenant } from "@/lib/platform/jobs/jobs-payload-tenant-guard";

const tenantA = "11111111-1111-4111-8111-111111111111";
const tenantB = "22222222-2222-4222-8222-222222222222";
const projectA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const projectB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("tenant isolation negative matrix (Phase 3)", () => {
  describe("media object paths", () => {
    it("denies foreign tenant-prefixed storage paths", () => {
      expect(assertMediaPathTenantScope(`${tenantB}/evidence.jpg`, tenantA).ok).toBe(false);
    });

    it("denies path traversal into another tenant prefix", () => {
      expect(normalizeMediaObjectPath(`${tenantA}/../${tenantB}/x.jpg`).ok).toBe(false);
    });

    it("flags foreign project prefix as candidate requiring DB proof", () => {
      const scope = inspectMediaPathScope(`${projectB}/photo.jpg`, tenantA);
      expect(scope.kind).toBe("project_prefix_candidate");
      if (scope.kind === "project_prefix_candidate") {
        expect(scope.projectIdCandidate).toBe(projectB);
      }
    });
  });

  describe("jobs payload project_id", () => {
    it("rejects when project_id is not a uuid", () => {
      expect(validateJobsPayloadProjectTenant("not-a-uuid", tenantA, () => true).ok).toBe(false);
    });

    it("rejects when project is not owned by tenant", () => {
      const result = validateJobsPayloadProjectTenant(projectB, tenantA, (projectId, tenantId) => {
        return projectId === projectA && tenantId === tenantA;
      });
      expect(result.ok).toBe(false);
    });

    it("allows empty project_id (no claim)", () => {
      expect(validateJobsPayloadProjectTenant(null, tenantA, () => false).ok).toBe(true);
    });

    it("allows when ownership callback confirms tenant", () => {
      const result = validateJobsPayloadProjectTenant(projectA, tenantA, (projectId, tenantId) => {
        return projectId === projectA && tenantId === tenantA;
      });
      expect(result.ok).toBe(true);
    });
  });
});
