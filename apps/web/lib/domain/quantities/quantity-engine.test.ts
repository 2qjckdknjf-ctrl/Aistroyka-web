import { describe, expect, it } from "vitest";
import { calculateQuantity, materialRequirement, PILOT_CATALOGUE, type QuantityRequest } from "./quantity-engine";
import { decimal, normalizeLength, priceLineTotalMinor, roundHalfUp } from "./exact-decimal";
import type { Shape } from "./planar-area";

const rect = (width: string, height: string, x = "0", y = "0"): Shape => ({ kind: "rectangle", origin: { x, y }, width, height });
const poly = (coords: [number, number][]): Shape => ({ kind: "polygon", vertices: coords.map(([x, y]) => ({ x: String(x), y: String(y) })) });
function surface(id: string, shape: Shape | null, zones?: Shape[], deductions: Shape[] = []) {
  return { id, shape, geometry_known: true, mapping_complete: true, deductions_complete: true,
    selection: zones ? "zones" as const : "whole" as const, zones: zones ?? [], deductions };
}
function area(surfaces: ReturnType<typeof surface>[], work_code = "Q-TILE-WALL"): Extract<QuantityRequest, { kind: "area" }> {
  return { kind: "area", rule_version: "1.0.0", work_code, quantity_kind: "planned", surfaces };
}
const quantity = (request: QuantityRequest) => calculateQuantity(request).quantity;

describe("C02 synthetic quantity gold cases for C04", () => {
  it("QG01 converts m/cm/mm without using display labels or multiplying work by waste", () => {
    for (const [unit, dims] of [["m", ["4.2", "2.1", "2.5"]], ["cm", ["420", "210", "250"]], ["mm", ["4200", "2100", "2500"]]] as const) {
      const [w, d, h] = dims.map(n => normalizeLength(n, unit));
      expect(quantity(area([surface("floor", rect(w, d))], "Q-TILE-FLOOR"))).toBe("8.820000");
      expect(quantity(area([surface("wall1", rect(w, h)), surface("wall2", rect(w, h)),
        surface("wall3", rect(d, h)), surface("wall4", rect(d, h))]))).toBe("31.500000");
    }
    expect(normalizeLength("4,2", "m")).toBe("4.200000000");
  });
  it("QG02 counts a two-stage system once and uses actual coverage intersection", () => {
    const wall = surface("wall", rect("5", "2.8"), undefined, [rect("1", "2")]);
    expect(quantity(area([wall], "Q-PAINT-WALL"))).toBe("12.000000");
    const completion: QuantityRequest = { ...area([surface("wall", rect("5", "2.8"))], "Q-PAINT-WALL"),
      quantity_kind: "system_complete", required_stages: ["first", "second"],
      surfaces: [{ ...surface("wall", rect("5", "2.8")), non_spatial_ready: true,
        accepted_stages: { first: [rect("2", "2")], second: [rect("2", "2", "1")] } }] };
    expect(quantity(completion)).toBe("2.000000");
  });
  it("QG03 unions overlap and repeated reports before subtracting openings", () => {
    const wall = surface("wall", rect("6", "3"), [rect("4", "2"), rect("4", "2", "2"), rect("4", "2")], [rect("1", "2", "3")]);
    expect(quantity(area([wall, wall]))).toBe("10.000000");
  });
  it("QG04 subtracts only the opening intersection with selected zones", () => {
    expect(quantity(area([surface("wall", rect("6", "3"), [rect("3", "3")], [rect("2", "2", "2")])]))).toBe("7.000000");
  });
  it("QG05 subtracts even small openings without an invented threshold", () => {
    expect(quantity(area([surface("wall", rect("4", "3"), undefined,
      [rect("0.9", "2"), rect("0.6", "0.5", "2", "1"), rect("0.2", "0.2", "3", "2")])]))).toBe("9.860000");
  });
  it("QG06 adds explicitly measured reveal surfaces separately", () => {
    expect(quantity(area([surface("wall", rect("4", "3"), undefined, [rect("0.9", "2")]),
      surface("left-reveal", rect("0.15", "2")), surface("right-reveal", rect("0.15", "2")),
      surface("top-reveal", rect("0.15", "0.9"))]))).toBe("10.935000");
  });
  it("QG07 separates work, material need and whole pack purchasing", () => {
    expect(materialRequirement("8.820000", "1", "0.10", "1.44")).toEqual({
      work_quantity: "8.820000", material_need: "9.702000", pack_count: "7", purchase_quantity: "10.080000", issues: [],
    });
    expect(materialRequirement("8.820000", "1", null, "1.44")).toMatchObject({ material_need: null, issues: ["material_parameters_missing"] });
    expect(materialRequirement("8.820000", "1", "0", "1.44")?.material_need).toBe("8.820000");
  });
  it("QG08 aggregates before rounding, retaining small positive quantities", () => {
    expect(quantity(area([surface("a", rect("3.3333", "1")), surface("b", rect("4.4444", "1"))]))).toBe("7.777700");
    expect(quantity(area([surface("a", rect("0.004", "1")), surface("b", rect("0.004", "1"))]))).toBe("0.008000");
  });
  it("QG09 merges physical seam intervals across adjacent surfaces/reports", () => {
    expect(quantity({ kind: "joint", work_code: "Q-SEAL-JOINT", rule_version: "1.0.0", quantity_kind: "reported",
      edges: [{ id: "edge1", length: "2.4", mapping_complete: true, intervals: [{ start: "0", end: "1.8" }, { start: "1.2", end: "2.4" }] },
        { id: "edge1", length: "2.4", mapping_complete: true, intervals: [{ start: "0", end: "1.8" }] },
        { id: "edge2", length: "1.5", mapping_complete: true, intervals: [{ start: "0", end: "1.5" }] }] })).toBe("3.900000");
  });
  it("QG10 distinguishes plan and accepted element bases while deduplicating stable IDs", () => {
    const request: QuantityRequest = { kind: "element", work_code: "Q-TRAY-INSTALL", rule_version: "1.0.0", quantity_kind: "planned",
      mapping_complete: true, elements: [{ id: "T1", state: "planned" }, { id: "T2", state: "planned" }, { id: "T1", state: "planned" }] };
    expect(quantity(request)).toBe("2.000000");
    expect(quantity({ ...request, quantity_kind: "accepted", elements: [{ id: "T1", state: "accepted" }, { id: "T1", state: "accepted" }, { id: "T2", state: "planned" }] })).toBe("1.000000");
  });
  it("QG11 measures a concave L-shaped floor rather than its bounding box", () => {
    expect(quantity(area([surface("floor", poly([[0, 0], [4, 0], [4, 1], [2, 1], [2, 3], [0, 3]]))], "Q-TILE-FLOOR"))).toBe("8.000000");
  });
  it("QG12 preserves unknown geometry, outside openings and unresolved mappings as null", () => {
    expect(calculateQuantity(area([surface("wall", null)])).issues).toContain("incomplete_basis");
    expect(calculateQuantity(area([surface("wall", poly([[0, 0], [2, 2], [0, 2], [2, 0]]))])).issues).toContain("invalid_geometry");
    expect(calculateQuantity(area([surface("wall", rect("2", "2"), undefined, [rect("1", "1", "2")])])).issues).toContain("outside_parent");
    expect(calculateQuantity(area([{ ...surface("wall", rect("2", "2")), mapping_complete: false }])).quantity).toBeNull();
  });
});

describe("exact geometry, bounds and independent arithmetic regressions", () => {
  it("counts rotated overlapping polygons exactly", () => {
    const a = poly([[2, 0], [4, 2], [2, 4], [0, 2]]), b = poly([[3, 0], [5, 2], [3, 4], [1, 2]]);
    expect(quantity(area([surface("wall", rect("6", "5"), [a, b])]))).toBe("11.500000");
  });
  it("keeps non-terminating intermediate fractions until the final six-place rounding", () => {
    const request: QuantityRequest = { ...area([surface("wall", rect("3", "1"))], "Q-PAINT-WALL"),
      quantity_kind: "system_complete", required_stages: ["coat"],
      surfaces: [{ ...surface("wall", rect("3", "1"), [rect("1", "1")]), non_spatial_ready: true,
        accepted_stages: { coat: [poly([[0, 0], [3, 0], [0, 1]])] } }] };
    expect(calculateQuantity(request)).toMatchObject({ quantity: "0.833333", trace: { exact_fraction: "5/6" } });
  });
  it("unions duplicate/overlapping deductions instead of subtracting them twice", () => {
    expect(quantity(area([surface("wall", rect("4", "3"), undefined,
      [rect("2", "2"), rect("2", "2", "1"), rect("2", "2")])]))).toBe("6.000000");
  });
  it("does not silently crop zones outside a concave parent", () => {
    const parent = poly([[0, 0], [4, 0], [4, 1], [2, 1], [2, 3], [0, 3]]);
    expect(calculateQuantity(area([surface("floor", parent, [rect("1", "1", "3", "2")])])).issues).toContain("outside_parent");
  });
  it("distinguishes two sides of a partition and rejects conflicting geometry for one stable ID", () => {
    expect(quantity(area([surface("side-a", rect("3", "2")), surface("side-b", rect("3", "2"))]))).toBe("12.000000");
    expect(calculateQuantity(area([surface("same", rect("3", "2")), surface("same", rect("4", "2"))])).issues).toContain("unresolved_mapping");
  });
  it("refuses sub-resolution quantities while allowing explicit surveyed zero selections", () => {
    expect(calculateQuantity(area([surface("a", rect("0.0000009", "1"))])).issues).toContain("below_storage_resolution");
    expect(quantity({ ...area([surface("a", rect("2", "2"), [])]), absence_confirmed: true })).toBe("0.000000");
    expect(quantity(area([surface("a", rect("1.2345675", "1"))]))).toBe("1.234568");
  });
  it("empty/default inputs do not manufacture a known zero", () => {
    expect(calculateQuantity(area([])).quantity).toBeNull();
    expect(quantity({ ...area([]), absence_confirmed: true })).toBe("0.000000");
    expect(calculateQuantity(area([surface("a", rect("2", "2"), [])])).quantity).toBeNull();
  });
  it("rejects missing readiness/coverage instead of treating stage minimum as system completion", () => {
    const request = { ...area([surface("a", rect("4", "4"))], "Q-PAINT-WALL"), quantity_kind: "system_complete" };
    expect(calculateQuantity(request).quantity).toBeNull();
    expect(calculateQuantity({ ...request, required_stages: ["coat"], surfaces: [{ ...surface("a", rect("4", "4")), accepted_stages: { coat: [rect("4", "4")] } }] }).quantity).toBeNull();
  });
  it("rejects price fields, silent layer factors, unsupported rules and fractional element entries", () => {
    expect(calculateQuantity({ ...area([surface("a", rect("2", "2"))]), price: "100" }).issues).toContain("invalid_input");
    expect(calculateQuantity({ ...area([surface("a", rect("2", "2"))]), layers: 2 }).quantity).toBeNull();
    expect(calculateQuantity({ ...area([surface("a", rect("2", "2"))]), work_code: "unknown" }).issues).toContain("unsupported_rule");
    expect(calculateQuantity({ kind: "element", work_code: "Q-TRAY-INSTALL", rule_version: "1.0.0", quantity_kind: "planned", mapping_complete: true, elements: [{ id: "tray", state: "planned", count: "0.5" }] }).quantity).toBeNull();
    expect(() => normalizeLength("4.2", "feet")).toThrow();
    expect(() => normalizeLength("1,234,567", "m")).toThrow();
  });
  it("rejects malformed/duplicate polygon vertices and out-of-bound/ambiguous edges", () => {
    for (const shape of [poly([[0, 0], [2, 0], [1, 0], [0, 2]]), poly([[0, 0], [2, 0], [2, 2], [0, 0]]), rect("-1", "2")]) {
      expect(calculateQuantity(area([surface("a", shape)])).issues).toContain("invalid_geometry");
    }
    expect(calculateQuantity({ kind: "joint", work_code: "Q-SEAL-JOINT", rule_version: "1.0.0", quantity_kind: "planned", edges: [{ id: "edge", length: "1", mapping_complete: true, intervals: [{ start: "0", end: "2" }] }] }).quantity).toBeNull();
  });
  it("matches independently counted grid cells across 40 deterministic rectangle-union/holes cases", () => {
    let seed = 19;
    const next = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed; };
    for (let trial = 0; trial < 40; trial++) {
      const rectangles = Array.from({ length: 5 }, () => {
        const x = next() % 8, y = next() % 8;
        return { x, y, w: 1 + next() % (10 - x), h: 1 + next() % (10 - y) };
      });
      const holes = [{ x: 2, y: 2, w: 3, h: 4 }, { x: 3, y: 1, w: 2, h: 3 }];
      const contains = (r: typeof holes[number], x: number, y: number) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
      let expected = 0;
      for (let x = 0; x < 10; x++) for (let y = 0; y < 10; y++) {
        if (rectangles.some(r => contains(r, x, y)) && !holes.some(r => contains(r, x, y))) expected++;
      }
      const convert = (r: typeof holes[number]) => rect(String(r.w), String(r.h), String(r.x), String(r.y));
      expect(quantity(area([surface("grid", rect("10", "10"), rectangles.map(convert), holes.map(convert))]))).toBe(`${expected}.000000`);
    }
  });
  it("keeps normalized rates exact and supports minor amounts beyond IEEE-754 integers", () => {
    expect(priceLineTotalMinor("1999", "7.200000", "10.000000")).toBe("2776");
    expect(priceLineTotalMinor("900719925474099312345", "1", "2")).toBe("1801439850948198624690");
    expect(roundHalfUp(decimal("1.005"), 2)).toBe("1.01");
    expect(() => priceLineTotalMinor("10", "0", "2")).toThrow();
    expect(Object.keys(PILOT_CATALOGUE)).toHaveLength(11);
  });
});
