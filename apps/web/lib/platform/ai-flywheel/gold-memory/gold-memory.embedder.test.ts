/**
 * Gold Memory embedder tests.
 */

import { describe, expect, it } from "vitest";
import {
  cosineSimilarity,
  computeInputHash,
  createNoOpGoldMemoryEmbedder,
} from "./gold-memory.embedder";

describe("gold-memory embedder", () => {
  it("no-op embedder returns null", async () => {
    const embedder = createNoOpGoldMemoryEmbedder();
    expect(embedder.available).toBe(false);
    expect(await embedder.embedText("hello")).toBeNull();
  });

  it("cosineSimilarity identical vectors = 1", () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
  });

  it("cosineSimilarity orthogonal vectors = 0", () => {
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0);
  });

  it("computeInputHash is stable", () => {
    const h1 = computeInputHash({ a: 1, b: 2 });
    const h2 = computeInputHash({ b: 2, a: 1 });
    expect(h1).toBe(h2);
    expect(h1.length).toBe(64);
  });
});
