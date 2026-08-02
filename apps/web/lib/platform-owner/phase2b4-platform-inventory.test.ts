/**
 * Phase 2B.4 — inventory + CSV integrity proofs.
 * Ensures 25 routes / 29 methods / guard-mode counts stay aligned with
 * Phase 2A baseline batch and the Phase 2B.4 security matrix CSV.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE2B4_EXPECTED,
  PHASE2B4_PLATFORM_METHODS,
} from "./phase2b4-platform-inventory";

const WEB_ROOT = join(process.cwd());
const REPO_ROOT = join(WEB_ROOT, "../..");
const CSV_PATH = join(
  REPO_ROOT,
  "docs/roadmap/AISTROYKA_PHASE2B4_PLATFORM_ROUTE_SECURITY_MATRIX.csv"
);
const PHASE2A_CSV = join(
  REPO_ROOT,
  "docs/roadmap/AISTROYKA_PHASE2A_API_ROUTE_MATRIX.csv"
);

function listPlatformRouteFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) listPlatformRouteFiles(full, acc);
    else if (name === "route.ts") acc.push(relative(WEB_ROOT, full));
  }
  return acc.sort();
}

function parseCsv(text: string): string[][] {
  return text
    .trim()
    .split("\n")
    .map((line) => {
      const cols: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
          continue;
        }
        if (ch === "," && !inQuotes) {
          cols.push(cur);
          cur = "";
          continue;
        }
        cur += ch;
      }
      cols.push(cur);
      return cols;
    });
}

describe("Phase 2B.4 platform inventory integrity", () => {
  it("matches expected method and guard-mode counts with UNKNOWN=0", () => {
    expect(PHASE2B4_PLATFORM_METHODS).toHaveLength(PHASE2B4_EXPECTED.methods);
    const files = new Set(PHASE2B4_PLATFORM_METHODS.map((r) => r.routeFile));
    expect(files.size).toBe(PHASE2B4_EXPECTED.routeFiles);
    expect(PHASE2B4_PLATFORM_METHODS.filter((r) => r.guardMode === "read")).toHaveLength(
      PHASE2B4_EXPECTED.read
    );
    expect(PHASE2B4_PLATFORM_METHODS.filter((r) => r.guardMode === "write")).toHaveLength(
      PHASE2B4_EXPECTED.write
    );
    expect(PHASE2B4_PLATFORM_METHODS.filter((r) => r.guardMode === "critical")).toHaveLength(
      PHASE2B4_EXPECTED.critical
    );
    expect(PHASE2B4_PLATFORM_METHODS.filter((r) => r.method === "GET")).toHaveLength(
      PHASE2B4_EXPECTED.get
    );
    expect(PHASE2B4_PLATFORM_METHODS.filter((r) => r.method === "POST")).toHaveLength(
      PHASE2B4_EXPECTED.post
    );
    expect(PHASE2B4_PLATFORM_METHODS.filter((r) => r.method === "PATCH")).toHaveLength(
      PHASE2B4_EXPECTED.patch
    );
    expect(PHASE2B4_PLATFORM_METHODS.filter((r) => r.method === "DELETE")).toHaveLength(
      PHASE2B4_EXPECTED.delete
    );
    expect(
      PHASE2B4_EXPECTED.methods * PHASE2B4_EXPECTED.negativeIdentitiesPerMethod
    ).toBe(PHASE2B4_EXPECTED.negativeIdentityProofs);
  });

  it("filesystem platform route.ts count is exactly 25 and matches inventory", () => {
    const onDisk = listPlatformRouteFiles(join(WEB_ROOT, "app/api/v1/platform"));
    expect(onDisk).toHaveLength(PHASE2B4_EXPECTED.routeFiles);
    const expected = [...new Set(PHASE2B4_PLATFORM_METHODS.map((r) => r.routeFile))].sort();
    expect(onDisk).toEqual(expected);
  });

  it("every inventory route file has a route.test.ts sibling", () => {
    for (const row of PHASE2B4_PLATFORM_METHODS) {
      const testFile = row.routeFile.replace(/route\.ts$/, "route.test.ts");
      const src = readFileSync(join(WEB_ROOT, testFile), "utf8");
      expect(src).toMatch(/requirePlatformOwnerApi/);
      expect(src).toMatch(/PLATFORM_NEGATIVE_IDENTITIES/);
      expect(src).toMatch(new RegExp(`mode:\\s*"${row.guardMode}"`));
    }
  });

  it("aligns with Phase 2A 2B_platform_negative_tests baseline paths (29 methods)", () => {
    const phase2a = readFileSync(PHASE2A_CSV, "utf8");
    const rows = parseCsv(phase2a);
    const header = rows[0];
    const batchIdx = header.indexOf("recommended_fix_batch");
    const pathIdx = header.indexOf("route_path");
    const methodIdx = header.indexOf("methods");
    expect(batchIdx).toBeGreaterThanOrEqual(0);
    expect(methodIdx).toBeGreaterThanOrEqual(0);
    const baseline = rows
      .slice(1)
      .filter((r) => r[batchIdx] === "2B_platform_negative_tests");
    expect(baseline.length).toBe(PHASE2B4_EXPECTED.routeFiles);

    const baselineMethods: Array<{ path: string; method: string }> = [];
    for (const r of baseline) {
      const path = r[pathIdx];
      const methods = String(r[methodIdx] ?? "").split("|").filter(Boolean);
      for (const method of methods) {
        baselineMethods.push({ path, method });
      }
    }
    expect(baselineMethods).toHaveLength(PHASE2B4_EXPECTED.methods);

    const invKeys = new Set(
      PHASE2B4_PLATFORM_METHODS.map((r) => `${r.method} ${r.routePath}`)
    );
    for (const b of baselineMethods) {
      expect(invKeys.has(`${b.method} ${b.path}`)).toBe(true);
    }
  });

  it("Phase 2B.4 CSV has exactly 29 data rows with PROVEN evidence and no UNKNOWN/blank", () => {
    const csv = readFileSync(CSV_PATH, "utf8");
    const rows = parseCsv(csv);
    const header = rows[0];
    expect(header).toEqual([
      "route_path",
      "method",
      "guard_mode",
      "middleware_test",
      "handler_guard_test",
      "anonymous_test",
      "tenant_owner_test",
      "tenant_admin_test",
      "tenant_member_test",
      "stakeholder_test",
      "service_role_test",
      "denial_no_side_effect_test",
      "allowed_role_test",
      "readonly_contract_test",
      "critical_step_up_test",
      "status",
      "evidence",
    ]);
    const data = rows.slice(1);
    expect(data).toHaveLength(PHASE2B4_EXPECTED.methods);
    for (const row of data) {
      expect(row).toHaveLength(header.length);
      for (const cell of row) {
        expect(cell.trim()).not.toBe("");
        expect(cell.trim()).not.toBe("UNKNOWN");
      }
      expect(row[header.indexOf("status")]).toBe("PROVEN");
      expect(row[header.indexOf("evidence")]).toMatch(/apps\/web\/.+/);
    }
  });

  it("does not mutate Phase 2A matrix content checksum for batch column presence", () => {
    const phase2a = readFileSync(PHASE2A_CSV, "utf8");
    expect(phase2a).toContain("2B_platform_negative_tests");
    expect(phase2a.split("\n").filter((l) => l.includes("2B_platform_negative_tests"))).toHaveLength(
      PHASE2B4_EXPECTED.routeFiles
    );
  });
});
