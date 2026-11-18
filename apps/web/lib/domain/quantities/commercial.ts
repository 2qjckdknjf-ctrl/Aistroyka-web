import { z } from "zod";
import {
  add,
  cmp,
  decimal,
  div,
  mul,
  rational,
  roundHalfUp,
  zero,
} from "./exact-decimal";

/** New policy only. Historical estimates continue to use calc.v1. */
export const COMMERCIAL_POLICY_VERSION = "commercial.stage2a.v1";

const minorAmount = z.string().max(30).regex(/^(0|[1-9][0-9]*)$/);
const quantityDecimal = z.string().max(40).regex(/^(0|[1-9][0-9]*)\.[0-9]{6}$/);
const basisPoints = z.string().max(9).regex(/^(0|[1-9][0-9]*)$/);
const unit = z.enum(["m2", "m", "ea"]);
const contextSchema = z.object({
  work_spec_hash: z.string().regex(/^[a-f0-9]{64}$/),
  unit,
  purpose: z.enum(["work", "material_need", "material_order"]),
  quantity_basis: z.enum(["physical_net", "system_area", "joint_length", "element_count"]),
  component_id: z.string().min(1).max(100).nullable(),
}).strict();
const rateSchema = z.object({
  numerator_minor: minorAmount,
  denominator_quantity: quantityDecimal.refine((value) => value !== "0.000000"),
  unit,
  currency: z.literal("EUR"),
  tax_treatment: z.enum(["included", "excluded"]),
}).strict();
const chargeSchema = z.object({
  id: z.string().min(1).max(100),
  kind: z.enum(["travel", "delivery", "fee"]),
  amount_minor: minorAmount,
  currency: z.literal("EUR"),
  tax_treatment: z.enum(["included", "excluded"]),
}).strict();
const discountSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }).strict(),
  z.object({ kind: z.literal("amount"), amount_minor: minorAmount }).strict(),
  z.object({ kind: z.literal("percentage"), rate_bps: basisPoints }).strict(),
]);

/** All commercial choices are explicit, including zero markup/tax and no charges. */
export const commercialInputSchema = z.object({
  currency: z.literal("EUR"),
  quantity: z.object({ value: quantityDecimal, context: contextSchema }).strict(),
  price: z.object({ price_use: z.literal("cost_input"), rate: rateSchema, context: contextSchema }).strict(),
  minimum_billable_quantity: quantityDecimal.nullable(),
  fixed_charges: z.array(chargeSchema).max(500),
  markup_bps: basisPoints,
  discount: discountSchema,
  tax_bps: basisPoints,
}).strict();

export type CommercialInput = z.infer<typeof commercialInputSchema>;
export type CommercialContext = z.infer<typeof contextSchema>;
export type CommercialError = Readonly<{ code: string; path: string }>;
export type CommercialTrace =
  | Readonly<{
    operation: "billable_quantity";
    physical_quantity: string;
    minimum_quantity: string | null;
    billable_quantity: string;
  }>
  | Readonly<{
    operation: "rate_line";
    numerator_minor: string;
    denominator_quantity: string;
    exact_minor: Readonly<{ numerator: string; denominator: string }>;
    rounded_minor: string;
  }>
  | Readonly<{
    operation: "fixed_charges";
    charge_ids: readonly string[];
    total_minor: string;
  }>
  | Readonly<{
    operation: "markup" | "discount" | "tax";
    basis_minor: string;
    rate_bps: string | null;
    amount_minor: string;
    result_minor: string;
  }>;
export type CommercialResult =
  | Readonly<{ ok: false; errors: readonly CommercialError[] }>
  | Readonly<{
    ok: true;
    policy_version: typeof COMMERCIAL_POLICY_VERSION;
    currency: "EUR";
    quantity_context: CommercialContext;
    physical_quantity: string;
    billable_quantity: string;
    line_cost_minor: string;
    fixed_charges_minor: string;
    cost_subtotal_minor: string;
    markup_minor: string;
    sale_before_discount_minor: string;
    discount_minor: string;
    net_subtotal_minor: string;
    tax_minor: string;
    total_minor: string;
    trace: readonly CommercialTrace[];
  }>;

function contextErrors(context: CommercialContext, path: string): CommercialError[] {
  const errors: CommercialError[] = [];
  if ((context.purpose === "work") !== (context.component_id === null)) {
    errors.push({ code: "invalid_component_context", path: `${path}.component_id` });
  }
  const areaBasis = context.quantity_basis === "physical_net" || context.quantity_basis === "system_area";
  if (context.purpose === "material_need" && (context.unit !== "m2" || !areaBasis)) {
    errors.push({ code: "unsupported_material_need_context", path });
  }
  if (context.purpose === "material_order" && (context.unit !== "ea" || !areaBasis)) {
    errors.push({ code: "unsupported_material_order_context", path });
  }
  if (context.purpose === "work") {
    const expected = context.quantity_basis === "element_count" ? "ea"
      : context.quantity_basis === "joint_length" ? "m" : "m2";
    if (context.unit !== expected) {
      errors.push({ code: "unit_basis_mismatch", path: `${path}.unit` });
    }
  }
  return errors;
}

function semanticErrors(input: CommercialInput): CommercialError[] {
  const errors = [
    ...contextErrors(input.quantity.context, "quantity.context"),
    ...contextErrors(input.price.context, "price.context"),
  ];
  const fields = ["work_spec_hash", "unit", "purpose", "quantity_basis", "component_id"] as const;
  for (const field of fields) {
    if (input.quantity.context[field] !== input.price.context[field]) {
      errors.push({ code: "quantity_price_context_mismatch", path: `price.context.${field}` });
    }
  }
  if (input.price.rate.unit !== input.price.context.unit) {
    errors.push({ code: "rate_unit_mismatch", path: "price.rate.unit" });
  }
  if (input.price.rate.tax_treatment !== "excluded") {
    errors.push({ code: "tax_normalization_required", path: "price.rate.tax_treatment" });
  }
  if (input.quantity.context.unit === "ea") {
    if (!input.quantity.value.endsWith(".000000")) {
      errors.push({ code: "fractional_element_or_pack_count", path: "quantity.value" });
    }
    if (input.minimum_billable_quantity !== null && !input.minimum_billable_quantity.endsWith(".000000")) {
      errors.push({ code: "fractional_element_or_pack_count", path: "minimum_billable_quantity" });
    }
  }
  if (input.price.rate.unit === "ea" && !input.price.rate.denominator_quantity.endsWith(".000000")) {
    errors.push({ code: "fractional_element_or_pack_count", path: "price.rate.denominator_quantity" });
  }
  const chargeIds = new Set<string>();
  for (const [index, charge] of input.fixed_charges.entries()) {
    if (chargeIds.has(charge.id)) {
      errors.push({ code: "duplicate_fixed_charge", path: `fixed_charges.${index}.id` });
    }
    chargeIds.add(charge.id);
    if (charge.tax_treatment !== "excluded") {
      errors.push({ code: "tax_normalization_required", path: `fixed_charges.${index}.tax_treatment` });
    }
  }
  if (BigInt(input.tax_bps) > BigInt(10000)) {
    errors.push({ code: "tax_rate_out_of_range", path: "tax_bps" });
  }
  if (input.discount.kind === "percentage" && BigInt(input.discount.rate_bps) > BigInt(10000)) {
    errors.push({ code: "discount_rate_out_of_range", path: "discount.rate_bps" });
  }
  return errors;
}

function percentageMinor(amount: bigint, rateBps: string): bigint {
  return BigInt(roundHalfUp(rational(amount * BigInt(rateBps), BigInt(10000)), 0));
}

/**
 * Cost-input, net EUR policy: HALF_UP(exact rate × billable quantity), add fixed net charges,
 * add rounded markup on that subtotal, subtract rounded discount, then add
 * rounded IVA on discounted net. No unit-rate rounding, currency conversion,
 * tax extraction, margin interpretation, quantity mutation or verification.
 */
export function calculateCommercialLine(value: unknown): CommercialResult {
  const parsed = commercialInputSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => ({ code: "invalid_input", path: issue.path.join(".") })),
    };
  }
  const input = parsed.data;
  const errors = semanticErrors(input);
  if (errors.length) return { ok: false, errors };

  const physical = decimal(input.quantity.value);
  const minimum = input.minimum_billable_quantity === null ? null : decimal(input.minimum_billable_quantity);
  const billable = minimum !== null && cmp(minimum, physical) > 0 ? minimum : physical;
  const billableQuantity = roundHalfUp(billable, 6);
  const rate = input.price.rate;
  const exactLine = mul(div(rational(BigInt(rate.numerator_minor)), decimal(rate.denominator_quantity)), billable);
  const lineCost = BigInt(roundHalfUp(exactLine, 0));
  const fixedCharges = input.fixed_charges.reduce((sum, charge) => add(sum, rational(BigInt(charge.amount_minor))), zero);
  const charges = BigInt(roundHalfUp(fixedCharges, 0));
  const costSubtotal = lineCost + charges;
  const markup = percentageMinor(costSubtotal, input.markup_bps);
  const sale = costSubtotal + markup;
  const discount = input.discount.kind === "amount" ? BigInt(input.discount.amount_minor)
    : input.discount.kind === "percentage" ? percentageMinor(sale, input.discount.rate_bps) : BigInt(0);
  if (discount > sale) {
    return { ok: false, errors: [{ code: "discount_exceeds_sale", path: "discount" }] };
  }
  const net = sale - discount;
  const tax = percentageMinor(net, input.tax_bps);
  const total = net + tax;
  const amounts = { line_cost_minor: lineCost, fixed_charges_minor: charges, cost_subtotal_minor: costSubtotal, markup_minor: markup, sale_before_discount_minor: sale, discount_minor: discount, net_subtotal_minor: net, tax_minor: tax, total_minor: total };
  const rangeErrors = Object.entries(amounts)
    .filter(([, amount]) => amount.toString().length > 30)
    .map(([path]) => ({ code: "amount_out_of_range", path }));
  if (rangeErrors.length) return { ok: false, errors: rangeErrors };
  return {
    ok: true,
    policy_version: COMMERCIAL_POLICY_VERSION,
    currency: "EUR",
    quantity_context: input.quantity.context,
    physical_quantity: input.quantity.value,
    billable_quantity: billableQuantity,
    line_cost_minor: lineCost.toString(),
    fixed_charges_minor: charges.toString(),
    cost_subtotal_minor: costSubtotal.toString(),
    markup_minor: markup.toString(),
    sale_before_discount_minor: sale.toString(),
    discount_minor: discount.toString(),
    net_subtotal_minor: net.toString(),
    tax_minor: tax.toString(),
    total_minor: total.toString(),
    trace: [
      { operation: "billable_quantity", physical_quantity: input.quantity.value, minimum_quantity: input.minimum_billable_quantity, billable_quantity: billableQuantity },
      { operation: "rate_line", numerator_minor: rate.numerator_minor, denominator_quantity: rate.denominator_quantity, exact_minor: { numerator: exactLine.n.toString(), denominator: exactLine.d.toString() }, rounded_minor: lineCost.toString() },
      { operation: "fixed_charges", charge_ids: input.fixed_charges.map((charge) => charge.id), total_minor: charges.toString() },
      { operation: "markup", basis_minor: costSubtotal.toString(), rate_bps: input.markup_bps, amount_minor: markup.toString(), result_minor: sale.toString() },
      { operation: "discount", basis_minor: sale.toString(), rate_bps: input.discount.kind === "percentage" ? input.discount.rate_bps : null, amount_minor: discount.toString(), result_minor: net.toString() },
      { operation: "tax", basis_minor: net.toString(), rate_bps: input.tax_bps, amount_minor: tax.toString(), result_minor: total.toString() },
    ],
  };
}
