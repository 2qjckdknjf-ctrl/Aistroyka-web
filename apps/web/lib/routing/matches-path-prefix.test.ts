import { describe, expect, it } from "vitest";
import { matchesPathPrefix } from "./matches-path-prefix";

describe("matchesPathPrefix", () => {
  it("matches the exact prefix and nested routes", () => {
    expect(matchesPathPrefix("/projects", "/projects")).toBe(true);
    expect(matchesPathPrefix("/projects/abc", "/projects")).toBe(true);
    expect(matchesPathPrefix("/subscribe", "/subscribe")).toBe(true);
  });

  it("does not treat a public marketing path as the dashboard /projects prefix", () => {
    expect(matchesPathPrefix("/projects-showcase", "/projects")).toBe(false);
  });
});
