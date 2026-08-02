import { describe, expect, it } from "vitest";
import { isSamePathOrChild } from "./path-segment";
import { isLegacyProjectsOrAiPath } from "./lite-allow-list";

describe("path-segment / legacy family classification", () => {
  it("isSamePathOrChild requires segment boundary", () => {
    expect(isSamePathOrChild("/api/projects", "/api/projects")).toBe(true);
    expect(isSamePathOrChild("/api/projects/", "/api/projects")).toBe(true);
    expect(isSamePathOrChild("/api/projects/p1", "/api/projects")).toBe(true);
    expect(isSamePathOrChild("/api/project", "/api/projects")).toBe(false);
    expect(isSamePathOrChild("/api/projectsz", "/api/projects")).toBe(false);
    expect(isSamePathOrChild("/api/projects-old", "/api/projects")).toBe(false);
    expect(isSamePathOrChild("/api/ai", "/api/ai")).toBe(true);
    expect(isSamePathOrChild("/api/ai/", "/api/ai")).toBe(true);
    expect(isSamePathOrChild("/api/ai/transcribe", "/api/ai")).toBe(true);
    expect(isSamePathOrChild("/api/aix", "/api/ai")).toBe(false);
    expect(isSamePathOrChild("/api/ai-tools", "/api/ai")).toBe(false);
  });

  it("classifies protected legacy families segment-safely", () => {
    for (const path of [
      "/api/projects",
      "/api/projects/",
      "/api/projects/p1",
      "/api/ai",
      "/api/ai/",
      "/api/ai/transcribe",
    ]) {
      expect(isLegacyProjectsOrAiPath(path), path).toBe(true);
    }
    for (const path of [
      "/api/project",
      "/api/projectsz",
      "/api/projects-old",
      "/api/aix",
      "/api/ai-tools",
      "/api/health",
      "/api/analysis/process",
      "/api/activation/status",
      "/api/tenant/invite",
    ]) {
      expect(isLegacyProjectsOrAiPath(path), path).toBe(false);
    }
  });
});
