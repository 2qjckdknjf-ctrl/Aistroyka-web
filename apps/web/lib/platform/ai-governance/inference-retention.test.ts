import { afterEach, describe, expect, it } from "vitest";
import {
  getInferenceRetentionMode,
  requireRetentionDeclaration,
  retentionBlocksEgress,
  retentionRuleHit,
} from "./inference-retention";

describe("inference retention declaration (D3a)", () => {
  const keys = ["AI_INFERENCE_RETENTION_MODE", "AI_REQUIRE_RETENTION_DECLARATION"] as const;
  const saved: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
      delete saved[key];
    }
  });

  function setEnv(key: (typeof keys)[number], value: string | undefined) {
    saved[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  it("defaults to undeclared when unset", () => {
    setEnv("AI_INFERENCE_RETENTION_MODE", undefined);
    expect(getInferenceRetentionMode()).toBe("undeclared");
    expect(retentionRuleHit()).toBe("retention_mode:undeclared");
  });

  it("accepts declared modes", () => {
    setEnv("AI_INFERENCE_RETENTION_MODE", "zero_retention_declared");
    expect(getInferenceRetentionMode()).toBe("zero_retention_declared");
    setEnv("AI_INFERENCE_RETENTION_MODE", "ephemeral_no_train_declared");
    expect(getInferenceRetentionMode()).toBe("ephemeral_no_train_declared");
  });

  it("treats unknown values as undeclared", () => {
    setEnv("AI_INFERENCE_RETENTION_MODE", "vendor_pinky_promise");
    expect(getInferenceRetentionMode()).toBe("undeclared");
  });

  it("does not block undeclared when strict gate is off (prod-safe default)", () => {
    setEnv("AI_INFERENCE_RETENTION_MODE", undefined);
    setEnv("AI_REQUIRE_RETENTION_DECLARATION", undefined);
    expect(requireRetentionDeclaration()).toBe(false);
    expect(retentionBlocksEgress()).toBe(false);
  });

  it("blocks undeclared when AI_REQUIRE_RETENTION_DECLARATION is true", () => {
    setEnv("AI_INFERENCE_RETENTION_MODE", undefined);
    setEnv("AI_REQUIRE_RETENTION_DECLARATION", "true");
    expect(retentionBlocksEgress()).toBe(true);
  });

  it("always blocks explicit blocked mode", () => {
    setEnv("AI_INFERENCE_RETENTION_MODE", "blocked");
    setEnv("AI_REQUIRE_RETENTION_DECLARATION", undefined);
    expect(retentionBlocksEgress()).toBe(true);
  });

  it("allows declared zero-retention even when strict", () => {
    setEnv("AI_INFERENCE_RETENTION_MODE", "zero_retention_declared");
    setEnv("AI_REQUIRE_RETENTION_DECLARATION", "1");
    expect(retentionBlocksEgress()).toBe(false);
  });
});
