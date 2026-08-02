import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));

function listSpecFiles(root: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(root)) {
    const full = path.join(root, name);
    if (statSync(full).isDirectory()) {
      out.push(...listSpecFiles(full));
      continue;
    }
    if (name.endsWith(".spec.ts")) out.push(full);
  }
  return out;
}

describe("Phase 4 required harness", () => {
  it("forbids soft-skipping in phase4 specs", () => {
    const specs = listSpecFiles(dir);
    expect(specs.length).toBeGreaterThan(0);
    const banned = /\b(?:test|describe)\.(?:skip|fix)\s*\(/;
    const offenders = specs.filter((file) => banned.test(readFileSync(file, "utf8"))).map((file) => path.basename(file));
    expect(offenders, `soft-skip offenders: ${offenders.join(", ")}`).toEqual([]);
  });

  it("wires e2e:phase4 through preflight and phase4 config", () => {
    const pkg = JSON.parse(readFileSync(path.join(dir, "../../package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    const script = pkg.scripts?.["e2e:phase4"] || "";
    expect(script).toContain("tests/phase4/preflight.mjs");
    expect(script).toContain("playwright.phase4.config.ts");
  });
});
