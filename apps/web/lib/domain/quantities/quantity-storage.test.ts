import { describe, expect, it } from "vitest";
import { calculateQuantity, parseQuantityRequest, type QuantityRequest } from "./quantity-engine";
import {
  assertNoCommercialFields,
  canonicalizeJson,
  hashQuantityRequest,
  normalizeEvidenceRefs,
  resolvePilotWorkSpecification,
} from "./quantity-storage";

const areaRequest = (): QuantityRequest => ({
  kind: "area",
  rule_version: "1.0.0",
  work_code: "Q-TILE-FLOOR",
  quantity_kind: "planned",
  surfaces: [
    {
      id: "floor",
      shape: {
        kind: "rectangle",
        origin: { x: "0", y: "0" },
        width: "4.2",
        height: "2.1",
      },
      geometry_known: true,
      mapping_complete: true,
      deductions_complete: true,
      selection: "whole",
      zones: [],
      deductions: [],
    },
  ],
});

describe("Stage2a A01 quantity storage helpers", () => {
  it("parses and hashes a valid QuantityRequest stably", () => {
    const a = areaRequest();
    const b = areaRequest();
    const parsed = parseQuantityRequest(a);
    expect(parsed.ok).toBe(true);
    expect(hashQuantityRequest(a)).toBe(hashQuantityRequest(b));
    expect(hashQuantityRequest(a)).toMatch(/^[a-f0-9]{64}$/);
    // Key order must not change the hash
    const reordered = JSON.parse(canonicalizeJson(a)) as QuantityRequest;
    expect(hashQuantityRequest(reordered)).toBe(hashQuantityRequest(a));
  });

  it("rejects invalid requests and commercial smuggling", () => {
    expect(parseQuantityRequest({ kind: "area" }).ok).toBe(false);
    expect(assertNoCommercialFields({ ...areaRequest(), unit_price: 10 })).toMatch(
      /commercial field forbidden/
    );
    expect(assertNoCommercialFields({ nested: { margin: 1 } })).toMatch(/margin/);
    expect(assertNoCommercialFields(areaRequest())).toBeNull();
  });

  it("resolves pilot WorkSpecification without prices", () => {
    const ok = resolvePilotWorkSpecification({
      work_code: "Q-TILE-FLOOR",
      title: "Floor tile net",
    });
    expect(ok).toEqual({
      ok: true,
      data: {
        work_code: "Q-TILE-FLOOR",
        rule_version: "1.0.0",
        unit: "m2",
        quantity_basis: "physical_net",
        rule_id: "surface-net.v1",
        title: "Floor tile net",
      },
    });
    if (ok.ok) {
      expect(Object.keys(ok.data).sort()).toEqual([
        "quantity_basis",
        "rule_id",
        "rule_version",
        "title",
        "unit",
        "work_code",
      ]);
    }
    expect(resolvePilotWorkSpecification({ work_code: "NOPE", title: "x" }).ok).toBe(false);
  });

  it("normalizes evidence refs and pairs storage hash with C04 calculation", () => {
    expect(
      normalizeEvidenceRefs([
        { kind: "media", id: "m1" },
        { kind: "", id: "bad" },
        null,
        { kind: "file", id: "f1" },
      ])
    ).toEqual([
      { kind: "media", id: "m1" },
      { kind: "file", id: "f1" },
    ]);

    const request = areaRequest();
    const calc = calculateQuantity(request);
    expect(calc.quantity).toBe("8.820000");
    expect(calc.issues).toEqual([]);
    expect(calc.unit).toBe("m2");
    // Storage hash is independent of calculation output
    expect(hashQuantityRequest(request)).not.toBe(hashQuantityRequest({ ...request, quantity_kind: "measured" }));
  });
});
