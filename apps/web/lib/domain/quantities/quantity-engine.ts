import { z } from "zod";
import { add, ceilNonnegative, cmp, decimal, key, mul, one, rational, roundHalfUp, zero, type Rational } from "./exact-decimal";
import { coveredArea, GeometryError, polygonIdentity, requireInside, toPolygon, type Polygon } from "./planar-area";

export const QUANTITY_RULE_VERSION = "1.0.0";
export const PILOT_CATALOGUE = {
  "Q-PROT-AREA": ["m2", "physical_net", "surface-net.v1"],
  "Q-DEMO-FLOOR": ["m2", "physical_net", "surface-net.v1"],
  "Q-DEMO-WALL": ["m2", "physical_net", "surface-net.v1"],
  "Q-WP-SYSTEM": ["m2", "system_area", "surface-net.v1"],
  "Q-TILE-FLOOR": ["m2", "physical_net", "surface-net.v1"],
  "Q-TILE-WALL": ["m2", "physical_net", "surface-net.v1"],
  "Q-MICROCEMENT": ["m2", "system_area", "surface-net.v1"],
  "Q-PAINT-WALL": ["m2", "system_area", "surface-net.v1"],
  "Q-PAINT-CEILING": ["m2", "system_area", "surface-net.v1"],
  "Q-SEAL-JOINT": ["m", "joint_length", "joint-length.v1"],
  "Q-TRAY-INSTALL": ["ea", "element_count", "element-count.v1"],
} as const;
type WorkCode = keyof typeof PILOT_CATALOGUE;
const value = z.string().max(40).regex(/^-?(0|[1-9][0-9]*)(\.[0-9]{1,9})?$/);
const id = z.string().min(1).max(100);
const point = z.object({ x: value, y: value }).strict();
const shape = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("rectangle"), origin: point, width: value, height: value }).strict(),
  z.object({ kind: z.literal("polygon"), vertices: z.array(point).min(3).max(128) }).strict(),
]);
const basis = {
  work_code: id, rule_version: z.literal(QUANTITY_RULE_VERSION),
  quantity_kind: z.enum(["planned", "reported", "measured", "accepted", "system_complete"]),
  absence_confirmed: z.boolean().optional(),
};
const areaSchema = z.object({
  ...basis, kind: z.literal("area"), required_stages: z.array(id).max(30).optional(),
  surfaces: z.array(z.object({
    id, shape: shape.nullable(), geometry_known: z.boolean(), mapping_complete: z.boolean(),
    deductions_complete: z.boolean(), selection: z.enum(["whole", "zones"]),
    zones: z.array(shape).max(64), deductions: z.array(shape).max(64),
    accepted_stages: z.record(id, z.array(shape).max(64)).optional(),
    non_spatial_ready: z.boolean().optional(),
  }).strict()).max(16),
}).strict();
const jointSchema = z.object({
  ...basis, kind: z.literal("joint"),
  edges: z.array(z.object({ id, length: value.nullable(), mapping_complete: z.boolean(),
    intervals: z.array(z.object({ start: value, end: value }).strict()).max(500),
  }).strict()).max(500),
}).strict();
const countSchema = z.object({
  ...basis, kind: z.literal("element"), mapping_complete: z.boolean(),
  elements: z.array(z.object({ id, state: z.enum(["planned", "reported", "measured", "accepted", "unknown"]) }).strict()).max(2000),
}).strict();
const requestSchema = z.discriminatedUnion("kind", [areaSchema, jointSchema, countSchema]);
export type QuantityRequest = z.infer<typeof requestSchema>;

/** Validate a QuantityRequest without calculating. Used by A01 storage adapters. */
export function parseQuantityRequest(
  raw: unknown
): { ok: true; data: QuantityRequest } | { ok: false; issues: ["invalid_input"] } {
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, issues: ["invalid_input"] };
  return { ok: true, data: parsed.data };
}

/** Pilot catalogue entry for a work code, or null when unsupported. */
export function catalogueEntryFor(
  workCode: string
): readonly [unit: "m2" | "m" | "ea", quantity_basis: string, rule_id: string] | null {
  if (!Object.prototype.hasOwnProperty.call(PILOT_CATALOGUE, workCode)) return null;
  return PILOT_CATALOGUE[workCode as WorkCode];
}
type Issue = "invalid_input" | "unsupported_rule" | "incomplete_basis" | "unresolved_mapping"
  | "invalid_geometry" | "outside_parent" | "complexity_limit" | "below_storage_resolution" | "quantity_out_of_range";
class InputError extends Error { constructor(public readonly code: Issue) { super(code); } }
export type QuantityCalculation = {
  quantity: string | null; unit: "m2" | "m" | "ea" | null; quantity_basis: string | null;
  rule_id: string | null; rule_version: typeof QUANTITY_RULE_VERSION;
  issues: Issue[]; trace: { exact_fraction: string; entity_ids: string[]; rounding: "ROUND_HALF_UP_6" } | null;
};
function areaTotal(input: z.infer<typeof areaSchema>): { total: Rational; ids: string[] } {
  const completeSystem = input.quantity_kind === "system_complete";
  const stages = input.required_stages;
  if (completeSystem && (!stages?.length || new Set(stages).size !== stages.length)) throw new InputError("incomplete_basis");
  const grouped = new Map<string, { parent: Polygon; groups: Polygon[][]; holes: Polygon[] }>();
  for (const surface of input.surfaces) {
    if (!surface.mapping_complete) throw new InputError("unresolved_mapping");
    if (!surface.geometry_known || !surface.shape || !surface.deductions_complete) throw new InputError("incomplete_basis");
    const rawShapes = [surface.shape, ...surface.zones, ...surface.deductions,
      ...Object.values(surface.accepted_stages ?? {}).flat()];
    if (rawShapes.reduce((n, shape) => n + (shape.kind === "rectangle" ? 4 : shape.vertices.length), 0) > 128) {
      throw new InputError("complexity_limit");
    }
    const parent = toPolygon(surface.shape), holes = surface.deductions.map(toPolygon);
    const selected = surface.selection === "whole" ? [parent] : surface.zones.map(toPolygon);
    // Never infer required-stage completion from area totals or from a photograph.
    let groups = [selected];
    if (completeSystem) {
      if (surface.non_spatial_ready !== true) throw new InputError("incomplete_basis");
      groups = stages!.map(stage => {
        const accepted = surface.accepted_stages?.[stage];
        if (!accepted) throw new InputError("incomplete_basis");
        return accepted.map(toPolygon);
      });
      groups.unshift(selected);
    }
    for (const child of [...surface.zones.map(toPolygon), ...groups.flat(), ...holes]) {
      if (polygonIdentity(parent) !== polygonIdentity(child)) requireInside(parent, child);
    }
    const current = grouped.get(surface.id);
    if (current) {
      if (polygonIdentity(current.parent) !== polygonIdentity(parent)) throw new InputError("unresolved_mapping");
      current.groups.forEach((group, i) => group.push(...groups[i]));
      current.holes.push(...holes);
    } else grouped.set(surface.id, { parent, groups, holes });
  }
  let total = zero;
  for (const item of grouped.values()) total = add(total, coveredArea([[item.parent], ...item.groups], item.holes));
  return { total, ids: [...grouped.keys()].sort() };
}
function jointTotal(input: z.infer<typeof jointSchema>): { total: Rational; ids: string[] } {
  if (input.quantity_kind === "system_complete") throw new InputError("unsupported_rule");
  if (input.edges.reduce((n, edge) => n + edge.intervals.length, 0) > 5000) throw new InputError("complexity_limit");
  const grouped = new Map<string, { length: Rational; intervals: { start: Rational; end: Rational }[] }>();
  for (const edge of input.edges) {
    if (!edge.mapping_complete) throw new InputError("unresolved_mapping");
    if (edge.length === null) throw new InputError("incomplete_basis");
    const length = decimal(edge.length);
    if (cmp(length, zero) <= 0) throw new InputError("invalid_geometry");
    const intervals = edge.intervals.map(interval => {
      const start = decimal(interval.start), end = decimal(interval.end);
      if (cmp(start, zero) < 0 || cmp(end, length) > 0 || cmp(start, end) >= 0) throw new InputError("outside_parent");
      return { start, end };
    });
    const current = grouped.get(edge.id);
    if (current) {
      if (cmp(current.length, length) !== 0) throw new InputError("unresolved_mapping");
      current.intervals.push(...intervals);
    } else grouped.set(edge.id, { length, intervals });
  }
  let total = zero;
  for (const edge of grouped.values()) {
    const sorted = edge.intervals.sort((a, b) => cmp(a.start, b.start));
    let start: Rational | null = null, end = zero;
    for (const interval of sorted) {
      if (start === null) { start = interval.start; end = interval.end; }
      else if (cmp(interval.start, end) <= 0) { if (cmp(interval.end, end) > 0) end = interval.end; }
      else { total = add(total, add(end, mul(start, decimal("-1")))); start = interval.start; end = interval.end; }
    }
    if (start !== null) total = add(total, add(end, mul(start, decimal("-1"))));
  }
  return { total, ids: [...grouped.keys()].sort() };
}
function countTotal(input: z.infer<typeof countSchema>): { total: Rational; ids: string[] } {
  if (!input.mapping_complete) throw new InputError("unresolved_mapping");
  if (input.quantity_kind === "system_complete") throw new InputError("unsupported_rule");
  const states = new Map<string, string>();
  for (const element of input.elements) {
    if (element.state === "unknown") throw new InputError("incomplete_basis");
    if (states.has(element.id) && states.get(element.id) !== element.state) throw new InputError("unresolved_mapping");
    states.set(element.id, element.state);
  }
  const ids = [...states.keys()].filter(id => states.get(id) === input.quantity_kind).sort();
  return { total: rational(BigInt(ids.length)), ids };
}

/** Pure C04 calculator for already normalized, explicitly scoped inputs.
 * It grants no access, writes no revisions and never produces a verified/accepted decision.
 * A01/A02 adapters must authorize inputs and bind immutable evidence/specification versions.
 */
export function calculateQuantity(raw: unknown): QuantityCalculation {
  const base: QuantityCalculation = { quantity: null, unit: null, quantity_basis: null, rule_id: null,
    rule_version: QUANTITY_RULE_VERSION, issues: [], trace: null };
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) return { ...base, issues: ["invalid_input"] };
  const input = parsed.data;
  const catalogue = Object.prototype.hasOwnProperty.call(PILOT_CATALOGUE, input.work_code)
    ? PILOT_CATALOGUE[input.work_code as WorkCode] : null;
  if (!catalogue || ({ area: "m2", joint: "m", element: "ea" } as const)[input.kind] !== catalogue[0]) return { ...base, issues: ["unsupported_rule"] };
  const metadata = { ...base, unit: catalogue[0], quantity_basis: catalogue[1], rule_id: catalogue[2] };
  if (input.quantity_kind === "system_complete" && catalogue[1] !== "system_area") {
    return { ...metadata, issues: ["unsupported_rule"] };
  }
  try {
    const result = input.kind === "area" ? areaTotal(input) : input.kind === "joint" ? jointTotal(input) : countTotal(input);
    if (cmp(result.total, zero) === 0 && input.absence_confirmed !== true) throw new InputError("incomplete_basis");
    if (cmp(result.total, zero) > 0 && cmp(result.total, decimal("0.000001")) < 0) throw new InputError("below_storage_resolution");
    const stored = roundHalfUp(result.total, 6);
    if (stored.length > 40) throw new InputError("quantity_out_of_range");
    return { ...metadata, quantity: stored, trace: {
      exact_fraction: key(result.total), entity_ids: result.ids, rounding: "ROUND_HALF_UP_6",
    } };
  } catch (error) {
    if (error instanceof InputError || error instanceof GeometryError) return { ...metadata, issues: [error.code] };
    throw error;
  }
}

export type MaterialCalculation = {
  work_quantity: string | null; material_need: string | null;
  pack_count: string | null; purchase_quantity: string | null;
  issues: ("invalid_input" | "material_parameters_missing" | "pack_coverage_missing" | "below_storage_resolution" | "quantity_out_of_range" | "quantity_precision_loss")[];
};

/** Need can be known before packaging. Neither result changes the work quantity. */
export function materialRequirement(workQuantity: string, consumption: string | null, waste: string | null, packCoverage: string | null): MaterialCalculation {
  const result: MaterialCalculation = { work_quantity: null, material_need: null,
    pack_count: null, purchase_quantity: null, issues: [] };
  try {
    const work = decimal(workQuantity);
    if (cmp(work, zero) < 0) return { ...result, issues: ["invalid_input"] };
    if (cmp(work, zero) > 0 && cmp(work, decimal("0.000001")) < 0) return { ...result, issues: ["below_storage_resolution"] };
    const storedWork = roundHalfUp(work, 6);
    if (storedWork.length > 40) return { ...result, issues: ["quantity_out_of_range"] };
    if (cmp(decimal(storedWork), work) !== 0) return { ...result, issues: ["quantity_precision_loss"] };
    result.work_quantity = storedWork;
    if (consumption === null || waste === null) return { ...result, issues: ["material_parameters_missing"] };
    const c = decimal(consumption), w = decimal(waste);
    if (cmp(c, zero) <= 0 || cmp(w, zero) < 0) return { ...result, issues: ["invalid_input"] };
    const need = mul(mul(work, c), add(one, w));
    if (cmp(need, zero) > 0 && cmp(need, decimal("0.000001")) < 0) return { ...result, issues: ["below_storage_resolution"] };
    const storedNeed = roundHalfUp(need, 6);
    if (storedNeed.length > 40) return { ...result, issues: ["quantity_out_of_range"] };
    result.material_need = storedNeed;
    if (packCoverage === null) return { ...result, issues: ["pack_coverage_missing"] };
    const pack = decimal(packCoverage);
    if (cmp(pack, zero) <= 0) return { ...result, issues: ["invalid_input"] };
    const packs = ceilNonnegative({ n: need.n * pack.d, d: need.d * pack.n });
    const purchase = roundHalfUp(mul(rational(packs), pack), 6);
    if (packs.toString().length > 33 || purchase.length > 40) return { ...result, issues: ["quantity_out_of_range"] };
    return { ...result, pack_count: packs.toString(), purchase_quantity: purchase };
  } catch {
    return { ...result, issues: ["invalid_input"] };
  }
}
