import { describe, expect, it } from "vitest";
import {
  findRawColorClasses,
  runRawColorPatternSelfTest,
} from "../scripts/raw-color-pattern.mjs";

describe("raw-color-pattern scanner", () => {
  it("passes built-in regression self-test", () => {
    const result = runRawColorPatternSelfTest();
    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("detects string-start utilities and directed borders with opacity", () => {
    expect(findRawColorClasses('"bg-red-500"')).toEqual(["red-500"]);
    expect(findRawColorClasses('"text-green-600"')).toEqual(["green-600"]);
    expect(findRawColorClasses('"border-l-4 border-l-amber-500"')).toEqual(["amber-500"]);
    expect(findRawColorClasses('"ring-amber-500/20"')).toEqual(["amber-500/20"]);
  });

  it("allows semantic aistroyka tokens and ignores test-like prose identifiers", () => {
    expect(findRawColorClasses('"bg-aistroyka-warning"')).toEqual([]);
    expect(findRawColorClasses("const bgRed500Helper = true;")).toEqual([]);
  });
});
