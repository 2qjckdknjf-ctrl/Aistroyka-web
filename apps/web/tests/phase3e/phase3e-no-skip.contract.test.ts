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

describe("Phase 3E required harness — no soft-skip", () => {
  it("forbids test.skip / describe.skip / test.fix in phase3e specs", () => {
    const specs = listSpecFiles(dir).filter((f) => f.endsWith(".spec.ts"));
    expect(specs.length).toBeGreaterThan(0);
    const banned = /\b(?:test|describe)\.(?:skip|fix)\s*\(/;
    const offenders: string[] = [];
    for (const file of specs) {
      const text = readFileSync(file, "utf8");
      if (banned.test(text)) offenders.push(path.basename(file));
    }
    expect(offenders, `soft-skip offenders: ${offenders.join(", ")}`).toEqual([]);
  });

  it("canonical e2e:pilot script points at phase3e config", () => {
    const pkg = JSON.parse(readFileSync(path.join(dir, "../../package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    const pilot = pkg.scripts?.["e2e:pilot"] || "";
    expect(pilot).toContain("playwright.phase3e.config.ts");
    expect(pilot).toContain("tests/phase3e/preflight.mjs");
    expect(pkg.scripts?.["e2e:pilot:legacy"]).toBeTruthy();
  });
});
