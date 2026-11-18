import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LG_REQUIRED_ROOT_VARS } from "./liquid-glass";

const tokensPath = join(dirname(fileURLToPath(import.meta.url)), "../../app/design-tokens.css");

describe("Liquid Glass CSS roots", () => {
  it("defines every required --lg-* custom property in design-tokens.css", () => {
    const css = readFileSync(tokensPath, "utf8");
    for (const name of LG_REQUIRED_ROOT_VARS) {
      expect(css, `missing ${name} in design-tokens.css`).toContain(`${name}:`);
    }
  });
});
