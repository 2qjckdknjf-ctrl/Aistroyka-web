/**
 * Phase 2B.5 — role model unify integrity proofs.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { ProjectMemberRole } from "@/lib/domain/project-members/project-members.types";
import { isTenantRoleDb } from "./tenant-membership.server";

const WEB_ROOT = process.cwd();

function walkTsFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === "node_modules" || name.name === ".next" || name.name === ".open-next") continue;
      walkTsFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(name.name) && !name.name.endsWith(".d.ts")) {
      acc.push(full);
    }
  }
  return acc;
}

describe("Phase 2B.5 role model unify integrity", () => {
  it("deleted (1) duplicate tenant role / stakeholder path files", () => {
    expect(existsSync(join(WEB_ROOT, "lib/tenant/tenant-role (1).server.ts"))).toBe(false);
    expect(existsSync(join(WEB_ROOT, "lib/tenant/stakeholder-dashboard-paths (1).ts"))).toBe(false);
    expect(existsSync(join(WEB_ROOT, "lib/tenant/stakeholder-dashboard-paths (1).test.ts"))).toBe(
      false
    );
  });

  it("canonical stakeholder-dashboard-paths retains portal rules", () => {
    const src = readFileSync(join(WEB_ROOT, "lib/tenant/stakeholder-dashboard-paths.ts"), "utf8");
    expect(src).toMatch(/\/portal\/projects/);
    expect(src).toMatch(/pathWithoutLocale\.startsWith\("\/portal"\)/);
  });

  it("legacy lib/auth/tenant.ts is removed", () => {
    expect(existsSync(join(WEB_ROOT, "lib/auth/tenant.ts"))).toBe(false);
  });

  it("no production imports of @/lib/auth/tenant remain", () => {
    const files = [
      ...walkTsFiles(join(WEB_ROOT, "app")),
      ...walkTsFiles(join(WEB_ROOT, "lib")),
      ...walkTsFiles(join(WEB_ROOT, "components")),
    ];
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      if (/from\s+["']@\/lib\/auth\/tenant["']/.test(src)) {
        offenders.push(file.replace(WEB_ROOT + "/", ""));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("ProjectMemberRole includes owner and matches repository export", () => {
    const roles = ["worker", "contractor", "manager", "owner"] as const satisfies readonly ProjectMemberRole[];
    expect(roles).toContain("owner");
    const typesSrc = readFileSync(
      join(WEB_ROOT, "lib/domain/project-members/project-members.types.ts"),
      "utf8"
    );
    const repoSrc = readFileSync(
      join(WEB_ROOT, "lib/domain/project-members/project-members.repository.ts"),
      "utf8"
    );
    expect(typesSrc).toMatch(/"owner"/);
    expect(repoSrc).toMatch(/from "\.\/project-members\.types"/);
    expect(repoSrc).not.toMatch(/export type ProjectMemberRole = "worker"/);
  });

  it("canonical membership API recognizes stakeholder", () => {
    expect(isTenantRoleDb("stakeholder")).toBe(true);
  });

  it("stakeholder middleware wiring is owned by Phase 2B.6 (helper import present)", () => {
    const mw = readFileSync(join(WEB_ROOT, "middleware.ts"), "utf8");
    expect(mw).toMatch(/resolveStakeholderPageRedirect/);
    expect(mw).toMatch(/stakeholder-middleware-gate/);
  });
});
