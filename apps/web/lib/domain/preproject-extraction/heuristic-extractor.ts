/**
 * Deterministic text heuristic for AIS-CLIENT-005A first slice.
 * Produces reviewable observations only — never estimates, contracts, or assignments.
 * Live LLM/photo providers plug in later behind the same observation contract.
 */

export type PreprojectObservationKind = "room" | "zone" | "work_item" | "note";
export type PreprojectUncertainty = "low" | "medium" | "high" | "unknown";

export type HeuristicObservationDraft = {
  kind: PreprojectObservationKind;
  label: string;
  payload: Record<string, unknown>;
  uncertainty: PreprojectUncertainty;
  source_coords: { field: string; match: string };
};

// Avoid JS `\b` — it is ASCII-only and breaks Cyrillic token matches.
const ROOM_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /(kitchen|кухн[а-яё]*)/iu, label: "Kitchen" },
  { re: /(bathroom|bath|санузел|ванн[а-яё]*)/iu, label: "Bathroom" },
  { re: /(bedroom|спальн[а-яё]*)/iu, label: "Bedroom" },
  { re: /(living\s*room|гостиная)/iu, label: "Living room" },
  { re: /(hallway|corridor|коридор|прихож[а-яё]*)/iu, label: "Hallway" },
];

const WORK_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /(paint(?:ing)?|покраск[а-яё]*|маляр[а-яё]*)/iu, label: "Painting" },
  { re: /(til(?:e|ing)|плитк[а-яё]*)/iu, label: "Tiling" },
  { re: /(floor(?:ing)?|напольн[а-яё]*)/iu, label: "Flooring" },
  { re: /(demolition|demo|демонтаж[а-яё]*)/iu, label: "Demolition" },
  { re: /(plaster|штукатур[а-яё]*|гипсокартон[а-яё]*)/iu, label: "Plaster / drywall" },
  { re: /(electrical|электрик[а-яё]*|проводк[а-яё]*)/iu, label: "Electrical" },
  { re: /(plumbing|сантехник[а-яё]*)/iu, label: "Plumbing" },
];

const FORBIDDEN_PAYLOAD_KEYS = new Set([
  "unit_price",
  "unit_cost",
  "total_price",
  "margin",
  "profitability",
  "cost",
  "costs",
  "markup",
  "subcontractor_cost",
  "internal_budget",
]);

/** Fail closed if a draft smuggles contractor finance into observation payload. */
export function assertObservationPayloadSafe(payload: unknown): string | null {
  return scan(payload, "");
}

function scan(value: unknown, path: string): string | null {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = scan(value[i], `${path}[${i}]`);
      if (hit) return hit;
    }
    return null;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_PAYLOAD_KEYS.has(key.toLowerCase())) {
        return `commercial field forbidden in observation: ${path ? `${path}.` : ""}${key}`;
      }
      const hit = scan(child, path ? `${path}.${key}` : key);
      if (hit) return hit;
    }
  }
  return null;
}

/**
 * Extract room/work suggestions from free text.
 * Empty / unknown text yields a single high-uncertainty note — never invents quantities or prices.
 */
export function extractHeuristicObservations(text: string): HeuristicObservationDraft[] {
  const source = typeof text === "string" ? text.trim() : "";
  if (!source) {
    return [
      {
        kind: "note",
        label: "Insufficient text for heuristic extraction",
        payload: { reason: "empty_input" },
        uncertainty: "high",
        source_coords: { field: "text", match: "" },
      },
    ];
  }

  const out: HeuristicObservationDraft[] = [];
  const seen = new Set<string>();

  for (const pattern of ROOM_PATTERNS) {
    const match = source.match(pattern.re);
    if (!match) continue;
    const key = `room:${pattern.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      kind: "room",
      label: pattern.label,
      payload: { detected_via: "text_heuristic.v1" },
      uncertainty: "medium",
      source_coords: { field: "text", match: match[0] },
    });
  }

  for (const pattern of WORK_PATTERNS) {
    const match = source.match(pattern.re);
    if (!match) continue;
    const key = `work:${pattern.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      kind: "work_item",
      label: pattern.label,
      payload: { detected_via: "text_heuristic.v1" },
      uncertainty: "medium",
      source_coords: { field: "text", match: match[0] },
    });
  }

  if (out.length === 0) {
    out.push({
      kind: "note",
      label: "No room or work keywords matched",
      payload: { detected_via: "text_heuristic.v1", preview: source.slice(0, 120) },
      uncertainty: "high",
      source_coords: { field: "text", match: source.slice(0, 40) },
    });
  }

  for (const item of out) {
    const bad = assertObservationPayloadSafe(item.payload);
    if (bad) throw new Error(bad);
  }
  return out;
}
