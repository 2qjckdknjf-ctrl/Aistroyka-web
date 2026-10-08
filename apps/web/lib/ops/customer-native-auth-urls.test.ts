import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("customer native auth allow-list", () => {
  it("includes the Customer callback in the Supabase redirect merger", () => {
    const src = readFileSync(resolve(__dirname, "../../scripts/set-supabase-auth-urls.mjs"), "utf8");
    expect(src).toContain("ai.aistroyka.customer://auth-callback");
    expect(src).toContain("ai.aistroyka.customer://**");
  });

  it("registers the Customer bundle as an Apple additional client id", () => {
    const src = readFileSync(resolve(__dirname, "../../scripts/enable-auth-apple.mjs"), "utf8");
    expect(src).toMatch(/ai\.aistroyka\.worker,ai\.aistroyka\.manager,ai\.aistroyka\.customer/);
  });
});
