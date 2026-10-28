import { describe, expect, it } from "vitest";
import { calculateQuantity, materialRequirement, PILOT_CATALOGUE, type QuantityRequest } from "./quantity-engine";
import { legacyUnitCostMinor } from "./exact-decimal";
import type { Shape } from "./planar-area";

const rectangle: Shape = { kind: "rectangle", origin: { x: "0", y: "0" }, width: "2", height: "3" };
const surface = { id: "wall", shape: rectangle, geometry_known: true, mapping_complete: true,
  deductions_complete: true, selection: "whole" as const, zones: [], deductions: [] };
const base = { rule_version: "1.0.0" as const, quantity_kind: "planned" as const };

describe("pilot catalogue and safe quantity boundaries", () => {
  it.each(Object.entries(PILOT_CATALOGUE))("executes %s with its declared unit and basis", (work_code, [unit, basis, rule]) => {
    const request: QuantityRequest = unit === "m2" ? { ...base, work_code, kind: "area", surfaces: [surface] }
      : unit === "m" ? { ...base, work_code, kind: "joint", edges: [{ id: "seam", length: "6", mapping_complete: true, intervals: [{ start: "0", end: "6" }] }] }
        : { ...base, work_code, kind: "element", mapping_complete: true, elements: [{ id: "tray", state: "planned" }] };
    expect(calculateQuantity(request)).toMatchObject({ quantity: unit === "ea" ? "1.000000" : "6.000000", unit, quantity_basis: basis, rule_id: rule, issues: [] });
  });
  it("preserves material need when only packaging is unknown", () => {
    expect(materialRequirement("8.82", "1", "0.10", null)).toEqual({
      work_quantity: "8.820000", material_need: "9.702000", pack_count: null, purchase_quantity: null, issues: ["pack_coverage_missing"],
    });
    expect(materialRequirement("8.82", null, "0", "1.44")).toMatchObject({ work_quantity: "8.820000", material_need: null, issues: ["material_parameters_missing"] });
    expect(materialRequirement("8.82", "1", "0", "0")).toMatchObject({ material_need: "8.820000", pack_count: null, issues: ["invalid_input"] });
    expect(materialRequirement("invalid", "1", "0", "1")).toMatchObject({ material_need: null, issues: ["invalid_input"] });
  });
  it("never treats physical-net work as a layered system", () => {
    expect(calculateQuantity({ ...base, kind: "area", work_code: "Q-DEMO-WALL", quantity_kind: "system_complete", required_stages: ["coat"],
      surfaces: [{ ...surface, non_spatial_ready: true, accepted_stages: { coat: [rectangle] } }] })).toMatchObject({ quantity: null, issues: ["unsupported_rule"] });
  });
  it("deduplicates a contour with reversed winding and a different starting vertex", () => {
    const reversed: Shape = { kind: "polygon", vertices: [{ x: "2", y: "3" }, { x: "2", y: "0" }, { x: "0", y: "0" }, { x: "0", y: "3" }] };
    expect(calculateQuantity({ ...base, kind: "area", work_code: "Q-TILE-WALL", surfaces: [surface, { ...surface, shape: reversed }] })).toMatchObject({ quantity: "6.000000", issues: [] });
  });
  it("rejects results exceeding C03 quantity storage instead of publishing invalid decimals", () => {
    const enormous = "1" + "0".repeat(39);
    expect(calculateQuantity({ ...base, work_code: "Q-SEAL-JOINT", kind: "joint", edges: [{ id: "seam", length: enormous, mapping_complete: true,
      intervals: [{ start: "0", end: enormous }] }] })).toMatchObject({ quantity: null, issues: ["quantity_out_of_range"] });
    expect(materialRequirement("100000000000000000000000000000000", "100000000000000000000000000000000", "0", "1")).toMatchObject({ material_need: null, issues: ["quantity_out_of_range"] });
  });
  it("requires an exactly stored work basis before material and pack derivation", () => {
    expect(materialRequirement("1.000000001", "1", "0", "1")).toMatchObject({ work_quantity: null, pack_count: null, issues: ["quantity_precision_loss"] });
    expect(materialRequirement("1.000000000", "1", "0", "1")).toMatchObject({ work_quantity: "1.000000", pack_count: "1", issues: [] });
  });
  it("only adapts rates representable exactly in the historical integer money model", () => {
    expect(legacyUnitCostMinor("1999", "7.200000")).toEqual({ unit_cost_minor: null, issue: "precision_loss" });
    expect(legacyUnitCostMinor("1440", "1.440000")).toEqual({ unit_cost_minor: 1000, issue: null });
    expect(legacyUnitCostMinor("9007199254740992", "1").issue).toBe("precision_loss");
    expect(legacyUnitCostMinor("0", "2")).toEqual({ unit_cost_minor: 0, issue: null });
    expect(legacyUnitCostMinor("1", "0").issue).toBe("invalid_input");
  });
});
