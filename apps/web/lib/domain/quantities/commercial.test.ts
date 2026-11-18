import { describe, expect, it } from "vitest";
import { legacyUnitCostMinor, priceLineTotalMinor } from "./exact-decimal";
import {
  calculateCommercialLine,
  COMMERCIAL_POLICY_VERSION,
  type CommercialInput,
} from "./commercial";

function example(): CommercialInput {
  const context = {
    work_spec_hash: "a".repeat(64),
    unit: "m2",
    purpose: "work",
    quantity_basis: "physical_net",
    component_id: null,
  } as const;
  return {
    currency: "EUR",
    quantity: { value: "10.000000", context },
    price: {
      price_use: "cost_input",
      context,
      rate: { numerator_minor: "1999", denominator_quantity: "7.200000", unit: "m2", currency: "EUR", tax_treatment: "excluded" },
    },
    minimum_billable_quantity: null,
    fixed_charges: [],
    markup_bps: "0",
    discount: { kind: "none" },
    tax_bps: "0",
  };
}

describe("commercial.stage2a.v1", () => {
  it("retains a supplier's rational rate until the whole line is rounded", () => {
    const result = calculateCommercialLine(example());
    expect(result).toMatchObject({ ok: true, policy_version: COMMERCIAL_POLICY_VERSION, line_cost_minor: "2776", total_minor: "2776" });
    if (!result.ok) throw new Error("Expected successful calculation");
    expect(result.trace[1]).toMatchObject({ exact_minor: { numerator: "49975", denominator: "18" } });
    expect(result.total_minor).not.toBe("2780");
  });

  it("uses half-up minor rounding and does not lose a tiny positive quantity", () => {
    const input = example();
    input.quantity.value = "0.000001";
    input.price.rate.numerator_minor = "500000";
    input.price.rate.denominator_quantity = "1.000000";
    expect(calculateCommercialLine(input)).toMatchObject({ ok: true, line_cost_minor: "1", physical_quantity: "0.000001" });
  });

  it("calculates beyond Number's exact integer range", () => {
    const input = example();
    input.quantity.value = "3.000000";
    input.price.rate.numerator_minor = "999999999999999999999999999999";
    input.price.rate.denominator_quantity = "3.000000";
    expect(calculateCommercialLine(input)).toMatchObject({ ok: true, total_minor: "999999999999999999999999999999" });
  });

  it("refuses a total outside the contract's 30-digit minor-amount range", () => {
    const input = example();
    input.price.rate.numerator_minor = "999999999999999999999999999999";
    input.price.rate.denominator_quantity = "1.000000";
    const result = calculateCommercialLine(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected failed calculation");
    expect(result.errors).toContainEqual({ code: "amount_out_of_range", path: "total_minor" });
  });

  it("keeps MOQ billing separate from the measured work", () => {
    const input = example();
    input.quantity.value = "2.000000";
    input.minimum_billable_quantity = "10.000000";
    input.price.rate.numerator_minor = "500";
    input.price.rate.denominator_quantity = "1.000000";
    expect(calculateCommercialLine(input)).toMatchObject({ ok: true, physical_quantity: "2.000000", billable_quantity: "10.000000", line_cost_minor: "5000" });
    expect(input.quantity.value).toBe("2.000000");
  });

  it("does not reduce the billable quantity when work exceeds MOQ", () => {
    const input = example();
    input.minimum_billable_quantity = "2.000000";
    expect(calculateCommercialLine(input)).toMatchObject({ ok: true, physical_quantity: "10.000000", billable_quantity: "10.000000", total_minor: "2776" });
  });

  it("applies net charges, markup, discount and IVA in the explicit policy order", () => {
    const input = example();
    input.fixed_charges = [
      { id: "travel", kind: "travel", amount_minor: "500", currency: "EUR", tax_treatment: "excluded" },
      { id: "delivery", kind: "delivery", amount_minor: "250", currency: "EUR", tax_treatment: "excluded" },
    ];
    input.markup_bps = "1000";
    input.discount = { kind: "percentage", rate_bps: "500" };
    input.tax_bps = "2100";
    const result = calculateCommercialLine(input);
    expect(result).toMatchObject({
      ok: true, line_cost_minor: "2776", fixed_charges_minor: "750", cost_subtotal_minor: "3526",
      markup_minor: "353", sale_before_discount_minor: "3879", discount_minor: "194",
      net_subtotal_minor: "3685", tax_minor: "774", total_minor: "4459",
      physical_quantity: "10.000000",
    });
    if (!result.ok) throw new Error("Expected successful calculation");
    expect(result.trace.map((step) => step.operation)).toEqual(["billable_quantity", "rate_line", "fixed_charges", "markup", "discount", "tax"]);
  });

  it("allows an explicit fixed discount and an explicit zero quantity", () => {
    const input = example();
    input.quantity.value = "0.000000";
    input.fixed_charges = [{ id: "callout", kind: "fee", amount_minor: "1000", currency: "EUR", tax_treatment: "excluded" }];
    input.discount = { kind: "amount", amount_minor: "100" };
    input.tax_bps = "2100";
    expect(calculateCommercialLine(input)).toMatchObject({ ok: true, physical_quantity: "0.000000", line_cost_minor: "0", net_subtotal_minor: "900", tax_minor: "189", total_minor: "1089" });
  });

  it("applies 100 percent discount without a negative net or tax", () => {
    const input = example();
    input.discount = { kind: "percentage", rate_bps: "10000" };
    input.tax_bps = "2100";
    expect(calculateCommercialLine(input)).toMatchObject({ ok: true, net_subtotal_minor: "0", tax_minor: "0", total_minor: "0" });
    input.discount = { kind: "amount", amount_minor: "2777" };
    expect(calculateCommercialLine(input)).toMatchObject({ ok: false, errors: [{ code: "discount_exceeds_sale", path: "discount" }] });
  });

  it("prices seven whole material packs as packs rather than area", () => {
    const input = example();
    input.quantity = { value: "7.000000", context: { ...input.quantity.context, purpose: "material_order", component_id: "tile-pack", unit: "ea" } };
    input.price.context = input.quantity.context;
    input.price.rate.unit = "ea";
    input.price.rate.denominator_quantity = "1.000000";
    expect(calculateCommercialLine(input)).toMatchObject({ ok: true, line_cost_minor: "13993" });
    input.price.rate.denominator_quantity = "1.500000";
    expect(calculateCommercialLine(input)).toMatchObject({ ok: false, errors: [
      { code: "fractional_element_or_pack_count", path: "price.rate.denominator_quantity" },
    ] });
  });

  it("rejects matching ea units when one means packs and the other work elements", () => {
    const input = example();
    input.quantity = { value: "7.000000", context: { ...input.quantity.context, purpose: "material_order", component_id: "tile-pack", unit: "ea" } };
    input.price.context = { ...input.quantity.context, purpose: "work", component_id: null, quantity_basis: "element_count" };
    input.price.rate.unit = "ea";
    const result = calculateCommercialLine(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected failed calculation");
    expect(result.errors).toContainEqual({ code: "quantity_price_context_mismatch", path: "price.context.purpose" });
  });

  it("requires the same specification, component, unit and quantity basis", () => {
    const input = example();
    input.price.context = { ...input.price.context, work_spec_hash: "b".repeat(64), unit: "m", quantity_basis: "joint_length" };
    input.price.rate.unit = "m";
    const result = calculateCommercialLine(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected failed calculation");
    expect(result.errors).toContainEqual({ code: "quantity_price_context_mismatch", path: "price.context.work_spec_hash" });
    expect(result.errors).toContainEqual({ code: "quantity_price_context_mismatch", path: "price.context.unit" });
    expect(result.errors).toContainEqual({ code: "quantity_price_context_mismatch", path: "price.context.quantity_basis" });
  });

  it.each(["sale_input", "reference_only", undefined])("refuses price use %s as an authoritative cost", (priceUse) => {
    const input = example();
    expect(calculateCommercialLine({ ...input, price: { ...input.price, price_use: priceUse } }).ok).toBe(false);
  });

  it("supports area-based material need and rejects unsupported material contexts", () => {
    const input = example();
    input.quantity.context = { ...input.quantity.context, purpose: "material_need", component_id: "tile" };
    input.price.context = input.quantity.context;
    expect(calculateCommercialLine(input)).toMatchObject({ ok: true, line_cost_minor: "2776" });
    input.quantity.context = { ...input.quantity.context, unit: "m", quantity_basis: "joint_length" };
    input.price.context = input.quantity.context;
    input.price.rate.unit = "m";
    expect(calculateCommercialLine(input)).toMatchObject({ ok: false, errors: [
      { code: "unsupported_material_need_context", path: "quantity.context" },
      { code: "unsupported_material_need_context", path: "price.context" },
    ] });
    input.quantity.context = { ...input.quantity.context, purpose: "material_order", unit: "ea", quantity_basis: "element_count" };
    input.price.context = input.quantity.context;
    input.price.rate.unit = "ea";
    input.price.rate.denominator_quantity = "1.000000";
    expect(calculateCommercialLine(input)).toMatchObject({ ok: false, errors: [
      { code: "unsupported_material_order_context", path: "quantity.context" },
      { code: "unsupported_material_order_context", path: "price.context" },
    ] });
  });

  it("rejects fractional element counts and fractional pack MOQ", () => {
    const input = example();
    input.quantity.context = { ...input.quantity.context, unit: "ea", quantity_basis: "element_count" };
    input.price.context = input.quantity.context;
    input.price.rate.unit = "ea";
    input.quantity.value = "0.500000";
    input.price.rate.denominator_quantity = "1.000000";
    input.minimum_billable_quantity = "1.500000";
    expect(calculateCommercialLine(input)).toMatchObject({ ok: false, errors: [
      { code: "fractional_element_or_pack_count", path: "quantity.value" },
      { code: "fractional_element_or_pack_count", path: "minimum_billable_quantity" },
    ] });
  });

  it("refuses automatic tax extraction and mixed-tax charges", () => {
    const input = example();
    input.price.rate.tax_treatment = "included";
    input.fixed_charges = [{ id: "delivery", kind: "delivery", amount_minor: "1210", currency: "EUR", tax_treatment: "included" }];
    expect(calculateCommercialLine(input)).toMatchObject({ ok: false, errors: [
      { code: "tax_normalization_required", path: "price.rate.tax_treatment" },
      { code: "tax_normalization_required", path: "fixed_charges.0.tax_treatment" },
    ] });
  });

  it("rejects duplicate charges and rates over 100 percent for discount or tax", () => {
    const input = example();
    const charge = { id: "delivery", kind: "delivery", amount_minor: "100", currency: "EUR", tax_treatment: "excluded" } as const;
    input.fixed_charges = [charge, charge];
    input.tax_bps = "10001";
    input.discount = { kind: "percentage", rate_bps: "10001" };
    expect(calculateCommercialLine(input)).toMatchObject({ ok: false, errors: [
      { code: "duplicate_fixed_charge", path: "fixed_charges.1.id" },
      { code: "tax_rate_out_of_range", path: "tax_bps" },
      { code: "discount_rate_out_of_range", path: "discount.rate_bps" },
    ] });
  });

  it.each([
    { field: "currency", value: "USD" },
    { field: "markup_bps", value: undefined },
    { field: "tax_bps", value: undefined },
    { field: "fixed_charges", value: undefined },
    { field: "discount", value: undefined },
    { field: "minimum_billable_quantity", value: undefined },
  ])("never fills a missing or unsupported $field", ({ field, value }) => {
    expect(calculateCommercialLine({ ...example(), [field]: value }).ok).toBe(false);
  });

  it.each(["1.00", "-1", "1e3", "NaN", "01", "1,00"])("rejects malformed minor amount %s", (amount) => {
    const input = example();
    input.price.rate.numerator_minor = amount;
    expect(calculateCommercialLine(input).ok).toBe(false);
  });

  it("refuses zero denominator and unknown fields instead of producing a price", () => {
    const input = example();
    input.price.rate.denominator_quantity = "0.000000";
    expect(calculateCommercialLine(input).ok).toBe(false);
    expect(calculateCommercialLine({ ...example(), verified: true }).ok).toBe(false);
    expect(calculateCommercialLine(null).ok).toBe(false);
  });

  it("keeps historical integer rates distinct from the exact policy and blocks an approximate transfer", () => {
    expect(priceLineTotalMinor("278", "1.000000", "10.000000")).toBe("2780");
    expect(legacyUnitCostMinor("1999", "7.200000")).toEqual({ unit_cost_minor: null, issue: "precision_loss" });
    expect(calculateCommercialLine(example())).toMatchObject({ ok: true, line_cost_minor: "2776" });
  });
});
