import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("next.config authInterrupts", () => {
  it("enables experimental.authInterrupts for forbidden() page gates", () => {
    const src = readFileSync(join(__dirname, "../../next.config.js"), "utf8");
    expect(src).toMatch(/authInterrupts:\s*true/);
  });
});
