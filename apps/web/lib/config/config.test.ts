import { describe, expect, it, vi, beforeEach } from "vitest";
import { hasSupabaseEnv, getBuildStamp } from "./public";
import { getServerConfig, isOpenAIConfigured } from "./server";
import { getDebugConfig, isDebugAuthAllowed, isDebugAllowedForRequest } from "./debug";

describe("config", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  describe("hasSupabaseEnv", () => {
    it("returns false when URL or key is missing", () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
      expect(hasSupabaseEnv()).toBe(false);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
      expect(hasSupabaseEnv()).toBe(false);
    });
    it("returns true when both are set", () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
      expect(hasSupabaseEnv()).toBe(true);
    });
  });

  describe("getBuildStamp", () => {
    it("returns empty strings when no sha env set", () => {
      vi.stubEnv("NEXT_PUBLIC_BUILD_SHA", "");
      vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "");
      vi.stubEnv("GITHUB_SHA", "");
      vi.stubEnv("CI", "");
      vi.stubEnv("NEXT_PUBLIC_BUILD_TIME", "");
      expect(getBuildStamp()).toEqual({ sha: "", buildTime: "" });
    });
    it("returns NEXT_PUBLIC_BUILD_SHA when set", () => {
      vi.stubEnv("NEXT_PUBLIC_BUILD_SHA", "abc1234");
      vi.stubEnv("NEXT_PUBLIC_BUILD_TIME", "2025-01-01T00:00:00Z");
      expect(getBuildStamp()).toEqual({ sha: "abc1234", buildTime: "2025-01-01T00:00:00Z" });
    });
    it("ignores VERCEL_GIT_COMMIT_SHA (non-canonical for Cloudflare)", () => {
      vi.stubEnv("NEXT_PUBLIC_BUILD_SHA", "");
      vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "vercel123");
      vi.stubEnv("GITHUB_SHA", "");
      vi.stubEnv("CI", "");
      vi.stubEnv("NEXT_PUBLIC_BUILD_TIME", "");
      expect(getBuildStamp()).toEqual({ sha: "", buildTime: "" });
    });
    it("uses GITHUB_SHA only when CI=true", () => {
      vi.stubEnv("NEXT_PUBLIC_BUILD_SHA", "");
      vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "");
      vi.stubEnv("GITHUB_SHA", "github456");
      vi.stubEnv("CI", "true");
      vi.stubEnv("NEXT_PUBLIC_BUILD_TIME", "");
      expect(getBuildStamp()).toEqual({ sha: "github456", buildTime: "" });
    });
  });

  describe("getServerConfig", () => {
    it("clamps AI_REQUEST_TIMEOUT_MS between 30k and 120k", () => {
      vi.stubEnv("AI_REQUEST_TIMEOUT_MS", "10000");
      expect(getServerConfig().AI_REQUEST_TIMEOUT_MS).toBe(30_000);
      vi.stubEnv("AI_REQUEST_TIMEOUT_MS", "200000");
      expect(getServerConfig().AI_REQUEST_TIMEOUT_MS).toBe(120_000);
    });
    it("returns default OPENAI_VISION_MODEL when unset", () => {
      vi.stubEnv("OPENAI_VISION_MODEL", undefined);
      expect(getServerConfig().OPENAI_VISION_MODEL).toBe("gpt-4o");
    });
    it("returns copilot defaults when unset", () => {
      vi.stubEnv("OPENAI_COPILOT_MODEL", undefined);
      vi.stubEnv("OPENAI_COPILOT_TIMEOUT_MS", undefined);
      vi.stubEnv("OPENAI_COPILOT_MAX_RETRIES", undefined);
      const c = getServerConfig();
      expect(c.OPENAI_COPILOT_MODEL).toBe("gpt-4o-mini");
      expect(c.OPENAI_COPILOT_TIMEOUT_MS).toBe(60_000);
      expect(c.OPENAI_COPILOT_MAX_RETRIES).toBe(2);
    });
    it("clamps OPENAI_COPILOT_TIMEOUT_MS between 15k and 120k", () => {
      vi.stubEnv("OPENAI_COPILOT_TIMEOUT_MS", "5000");
      expect(getServerConfig().OPENAI_COPILOT_TIMEOUT_MS).toBe(15_000);
      vi.stubEnv("OPENAI_COPILOT_TIMEOUT_MS", "200000");
      expect(getServerConfig().OPENAI_COPILOT_TIMEOUT_MS).toBe(120_000);
    });
    it("clamps OPENAI_TRANSCRIPTION_TIMEOUT_MS between 30k and 180k", () => {
      vi.stubEnv("OPENAI_TRANSCRIPTION_TIMEOUT_MS", "10000");
      expect(getServerConfig().OPENAI_TRANSCRIPTION_TIMEOUT_MS).toBe(30_000);
      vi.stubEnv("OPENAI_TRANSCRIPTION_TIMEOUT_MS", "300000");
      expect(getServerConfig().OPENAI_TRANSCRIPTION_TIMEOUT_MS).toBe(180_000);
    });
  });

  describe("isOpenAIConfigured", () => {
    it("returns false when OPENAI_API_KEY is empty", () => {
      vi.stubEnv("OPENAI_API_KEY", "");
      expect(isOpenAIConfigured()).toBe(false);
    });
    it("returns true when OPENAI_API_KEY is set", () => {
      vi.stubEnv("OPENAI_API_KEY", "sk-test");
      expect(isOpenAIConfigured()).toBe(true);
    });
  });

  describe("getDebugConfig", () => {
    it("debugAuth is true in development", () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("DEBUG_AUTH", undefined);
      expect(getDebugConfig().debugAuth).toBe(true);
    });
    it("debugAuth is false in production unless DEBUG_AUTH or ENABLE_DIAG_ROUTES", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DEBUG_AUTH", "false");
      vi.stubEnv("ENABLE_DIAG_ROUTES", undefined);
      expect(getDebugConfig().debugAuth).toBe(false);
      vi.stubEnv("DEBUG_AUTH", "true");
      expect(getDebugConfig().debugAuth).toBe(true);
      vi.stubEnv("DEBUG_AUTH", "false");
      vi.stubEnv("ENABLE_DIAG_ROUTES", "true");
      expect(getDebugConfig().debugAuth).toBe(true);
      expect(getDebugConfig().debugDiag).toBe(true);
    });
  });

  describe("isDebugAllowedForRequest", () => {
    it("in production with no request returns false", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("ALLOW_DEBUG_HOSTS", "localhost");
      expect(isDebugAllowedForRequest(undefined)).toBe(false);
    });
    it("in production with request host in ALLOW_DEBUG_HOSTS returns true", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("ALLOW_DEBUG_HOSTS", "localhost,example.com");
      const req = new Request("https://localhost/api/_debug/auth", { headers: { host: "localhost" } });
      expect(isDebugAllowedForRequest(req)).toBe(true);
    });
    it("in production with request host not in ALLOW_DEBUG_HOSTS returns false", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("ALLOW_DEBUG_HOSTS", "example.com");
      const req = new Request("https://evil.com/api/_debug/auth", { headers: { host: "evil.com" } });
      expect(isDebugAllowedForRequest(req)).toBe(false);
    });
    it("in development with ALLOW_DEBUG_HOSTS set enforces host allowlist", () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("ALLOW_DEBUG_HOSTS", "localhost,staging.example.com");
      const reqOk = new Request("https://localhost/", { headers: { host: "localhost" } });
      expect(isDebugAllowedForRequest(reqOk)).toBe(true);
      const reqBad = new Request("https://other.example.com/", { headers: { host: "other.example.com" } });
      expect(isDebugAllowedForRequest(reqBad)).toBe(false);
    });
    it("in development with ALLOW_DEBUG_HOSTS unset returns true (no request)", () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("ALLOW_DEBUG_HOSTS", "");
      expect(isDebugAllowedForRequest(undefined)).toBe(true);
    });
  });

  describe("isDebugAuthAllowed", () => {
    it("in development returns true without request", () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("DEBUG_AUTH", undefined);
      expect(isDebugAuthAllowed()).toBe(true);
    });
    it("in production requires DEBUG_AUTH and host allowlist", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DEBUG_AUTH", "true");
      vi.stubEnv("ALLOW_DEBUG_HOSTS", "allowed.example.com");
      expect(isDebugAuthAllowed()).toBe(false);
      const req = new Request("https://allowed.example.com/", { headers: { host: "allowed.example.com" } });
      expect(isDebugAuthAllowed(req)).toBe(true);
    });
  });
});
