import { describe, expect, it, vi, beforeEach } from "vitest";
import { hasSupabaseEnv, getBuildStamp } from "./public";
import { getServerConfig, isOpenAIConfigured } from "./server";
import { getDebugConfig } from "./debug";

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
    it("returns empty strings when env not set", () => {
      vi.stubEnv("NEXT_PUBLIC_BUILD_SHA", undefined);
      vi.stubEnv("NEXT_PUBLIC_BUILD_TIME", undefined);
      expect(getBuildStamp()).toEqual({ sha: "", buildTime: "" });
    });
    it("returns env values when set", () => {
      vi.stubEnv("NEXT_PUBLIC_BUILD_SHA", "abc1234");
      vi.stubEnv("NEXT_PUBLIC_BUILD_TIME", "2025-01-01T00:00:00Z");
      expect(getBuildStamp()).toEqual({ sha: "abc1234", buildTime: "2025-01-01T00:00:00Z" });
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
    it("debugAuth is false in production unless DEBUG_AUTH=true", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DEBUG_AUTH", "false");
      expect(getDebugConfig().debugAuth).toBe(false);
      vi.stubEnv("DEBUG_AUTH", "true");
      expect(getDebugConfig().debugAuth).toBe(true);
    });
  });
});
