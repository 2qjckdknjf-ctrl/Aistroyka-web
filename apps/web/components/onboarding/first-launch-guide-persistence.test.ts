import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("FirstLaunchGuide persistence key (PD-P2-04)", () => {
  it("keeps the Slice 01 persistence key unchanged", () => {
    const source = readFileSync(
      resolve(__dirname, "FirstLaunchGuide.tsx"),
      "utf8"
    );
    expect(source).toContain('const STORAGE_KEY = "aistroyka:first-launch-guide:v1"');
    expect(source).not.toMatch(/aistroyka:first-launch-guide:v[2-9]/);
  });
});
