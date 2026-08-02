import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const messagesDir = resolve(__dirname, "../../../messages");

function load(locale: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(messagesDir, `${locale}.json`), "utf8")) as Record<
    string,
    unknown
  >;
}

function dig(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

describe("AI public claims contract (Phase 7)", () => {
  for (const locale of ["en", "ru", "es", "it"] as const) {
    it(`${locale}: homepage AI card is beta-labeled and Level 4 remains a building floor`, () => {
      const m = load(locale);
      const aiTitle = String(dig(m, "public.home.heroCardAiTitle") ?? "");
      expect(aiTitle.toLowerCase()).toMatch(/beta|degraded|бета|бета-режим|beta/);
      const level4 = String(dig(m, "public.home.heroLensTitle") ?? "");
      // Floor label may contain "Level 4" — that is not AI maturity.
      if (level4.toLowerCase().includes("level 4")) {
        expect(level4.toLowerCase()).not.toMatch(/ai maturity|level 4 ai/);
      }
      const mockTitle = String(dig(m, "public.copilot.mockInterfaceTitle") ?? "");
      expect(mockTitle.toLowerCase()).toMatch(/mock|simulation|симуляц|demo|демо/);
    });

    it(`${locale}: forbids autonomous live-provider marketing claims`, () => {
      const raw = readFileSync(resolve(messagesDir, `${locale}.json`), "utf8");
      const forbidden = [
        /production-ready Copilot/i,
        /fully autonomous AI decisions/i,
        /multi-provider failover guaranteed/i,
        /Level 4 AI/i,
        /live provider analysis on every request/i,
      ];
      for (const re of forbidden) {
        expect(raw).not.toMatch(re);
      }
    });
  }
});
