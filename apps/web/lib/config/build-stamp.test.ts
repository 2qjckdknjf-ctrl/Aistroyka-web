import { describe, expect, it } from "vitest";
import {
  isReleaseStampRequired,
  isValidBuildSha,
  resolveBuildStamp,
  toHealthBuildStamp,
} from "./build-stamp";

describe("build-stamp", () => {
  it("validates sha shape", () => {
    expect(isValidBuildSha("a401693")).toBe(true);
    expect(isValidBuildSha("a401693deadbeefdeadbeefdeadbeefdeadbee")).toBe(true);
    expect(isValidBuildSha("")).toBe(false);
    expect(isValidBuildSha("unknown")).toBe(false);
    expect(isValidBuildSha("ZZZZZZZ")).toBe(false);
  });

  it("prefers NEXT_PUBLIC_BUILD_SHA and ignores Vercel SHA", () => {
    const stamp = resolveBuildStamp({
      NEXT_PUBLIC_BUILD_SHA: "abc1234deadbeef",
      NEXT_PUBLIC_BUILD_TIME: "2026-07-30 12:00",
      VERCEL_GIT_COMMIT_SHA: "vercelsha",
      GITHUB_SHA: "githubsha",
    });
    expect(stamp).toEqual({
      sha: "abc1234deadbeef",
      buildTime: "2026-07-30 12:00",
      source: "next_public",
    });
  });

  it("does not use Vercel SHA when NEXT_PUBLIC missing", () => {
    const stamp = resolveBuildStamp({
      NEXT_PUBLIC_BUILD_SHA: "",
      VERCEL_GIT_COMMIT_SHA: "vercelsha123",
      GITHUB_SHA: "",
      CI: "",
    });
    expect(stamp.source).toBe("none");
    expect(stamp.sha).toBe("");
  });

  it("allows GITHUB_SHA only in CI", () => {
    const stamp = resolveBuildStamp({
      NEXT_PUBLIC_BUILD_SHA: "",
      GITHUB_SHA: "abcdef0123456789abcdef0123456789abcdef01",
      CI: "true",
      NEXT_PUBLIC_BUILD_TIME: "t",
    });
    expect(stamp.source).toBe("github_ci");
    expect(stamp.sha.startsWith("abcdef0")).toBe(true);
  });

  it("requires stamp for staging/production only", () => {
    expect(isReleaseStampRequired({ NEXT_PUBLIC_APP_ENV: "staging" })).toBe(true);
    expect(isReleaseStampRequired({ NEXT_PUBLIC_APP_ENV: "production" })).toBe(true);
    expect(isReleaseStampRequired({ NEXT_PUBLIC_APP_ENV: "development" })).toBe(false);
    expect(isReleaseStampRequired({})).toBe(false);
  });

  it("toHealthBuildStamp rejects incomplete stamps", () => {
    expect(toHealthBuildStamp({ sha: "a401693", buildTime: "", source: "next_public" })).toBeNull();
    expect(toHealthBuildStamp({ sha: "unknown", buildTime: "t", source: "next_public" })).toBeNull();
    expect(toHealthBuildStamp({ sha: "a401693", buildTime: "2026-07-18 22:29", source: "next_public" })).toEqual({
      sha7: "a401693",
      buildTime: "2026-07-18 22:29",
    });
  });
});
