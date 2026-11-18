import { describe, expect, it } from "vitest";
import {
  assertObservationPayloadSafe,
  extractHeuristicObservations,
} from "./heuristic-extractor";

describe("AIS-CLIENT-005A text heuristic extractor", () => {
  it("extracts rooms and work items from mixed EN/RU text without prices", () => {
    const items = extractHeuristicObservations(
      "Нужен ремонт кухни и ванной: плитка, покраска стен, без электрики пока."
    );
    const kinds = items.map((i) => i.kind).sort();
    expect(kinds).toContain("room");
    expect(kinds).toContain("work_item");
    expect(items.some((i) => i.label === "Kitchen")).toBe(true);
    expect(items.some((i) => i.label === "Bathroom")).toBe(true);
    expect(items.some((i) => i.label === "Tiling")).toBe(true);
    expect(items.some((i) => i.label === "Painting")).toBe(true);
    for (const item of items) {
      expect(assertObservationPayloadSafe(item.payload)).toBeNull();
      expect(JSON.stringify(item)).not.toMatch(/unit_price|margin|profitability/i);
    }
  });

  it("returns high-uncertainty note for empty or unmatched text", () => {
    expect(extractHeuristicObservations("").map((i) => i.kind)).toEqual(["note"]);
    expect(extractHeuristicObservations("hello world").every((i) => i.kind === "note")).toBe(true);
  });

  it("rejects commercial payload smuggling", () => {
    expect(assertObservationPayloadSafe({ margin: 12 })).toMatch(/commercial field forbidden/);
    expect(assertObservationPayloadSafe({ nested: { unit_price: 1 } })).toMatch(/unit_price/);
  });
});
