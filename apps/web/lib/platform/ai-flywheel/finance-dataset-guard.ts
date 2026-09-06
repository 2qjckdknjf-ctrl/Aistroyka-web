/**
 * Finance dataset guard — blocks internal finance vocabulary from owner-audience exports.
 * Isolation lives in data projection/export guards, not model behavior.
 */

export type DatasetAudience = "internal" | "owner" | "customer" | "worker" | "manager";

export interface DatasetExample {
  id: string;
  audience: DatasetAudience;
  text: string;
  labels?: Record<string, unknown>;
}

export interface FinanceGuardReport {
  passed: boolean;
  blockedCount: number;
  blockedIds: string[];
  reasons: Record<string, string[]>;
}

/** Internal finance vocabulary — must not appear in owner/customer audience examples. */
const INTERNAL_FINANCE_TERMS = [
  "margin",
  "profitability",
  "internal budget",
  "budget pressure",
  "planned cost",
  "actual cost",
  "cost overrun",
  "subcontractor cost",
  "labor cost",
  "internal estimate",
  "margin risk",
  "cashflow",
  "cost item",
  "internal finance",
  "маржа",
  "рентабельность",
  "внутренний бюджет",
  "перерасход",
  "себестоимость",
];

const INTERNAL_AMOUNT_PATTERNS = [
  /\binternal\s+cost[:\s]*€?\s*[\d,.]+/i,
  /\bmargin[:\s]*-?\s*[\d.]+\s*%/i,
  /\bprofit[:\s]*€?\s*[\d,.]+/i,
  /\bplanned\s+vs\s+actual[:\s]*€?\s*[\d,.]+/i,
  /\bsubcontractor\s+price[:\s]*€?\s*[\d,.]+/i,
];

const OWNER_SAFE_TERMS = [
  "estimate for approval",
  "change order",
  "payment schedule",
  "approved amount",
  "customer estimate",
  "смета на согласование",
  "допсмета",
];

function containsInternalFinanceVocabulary(text: string): string[] {
  const lower = text.toLowerCase();
  const hits: string[] = [];
  for (const term of INTERNAL_FINANCE_TERMS) {
    if (lower.includes(term.toLowerCase())) hits.push(term);
  }
  for (const re of INTERNAL_AMOUNT_PATTERNS) {
    if (re.test(text)) hits.push(re.source);
  }
  return hits;
}

/** Guard owner/customer audience examples against internal finance leakage. */
export function ownerAudienceDatasetGuard(example: DatasetExample): { passed: boolean; reasons: string[] } {
  if (example.audience !== "owner" && example.audience !== "customer") {
    return { passed: true, reasons: [] };
  }
  const hits = containsInternalFinanceVocabulary(example.text);
  if (hits.length > 0) {
    return { passed: false, reasons: hits.map((h) => `internal_finance_vocabulary:${h}`) };
  }
  return { passed: true, reasons: [] };
}

/** Guard batch; returns report with blocked counts. */
export function financeDatasetGuard(examples: DatasetExample[]): FinanceGuardReport {
  const blockedIds: string[] = [];
  const reasons: Record<string, string[]> = {};

  for (const ex of examples) {
    const result = ownerAudienceDatasetGuard(ex);
    if (!result.passed) {
      blockedIds.push(ex.id);
      reasons[ex.id] = result.reasons;
    }
    // Internal audience examples must retain audience label — no auto-block
    if (ex.audience === "internal" && !ex.labels?.audience) {
      // warn-only in guard; export path should set labels
    }
  }

  return {
    passed: blockedIds.length === 0,
    blockedCount: blockedIds.length,
    blockedIds,
    reasons,
  };
}

/** Check owner-safe commercial vocabulary is present (informational, not blocking). */
export function isLikelyOwnerSafeCommercial(text: string): boolean {
  const lower = text.toLowerCase();
  return OWNER_SAFE_TERMS.some((t) => lower.includes(t.toLowerCase()));
}
