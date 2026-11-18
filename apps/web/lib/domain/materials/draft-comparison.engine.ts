import { priceLineTotalMinor } from "@/lib/domain/quantities/exact-decimal";

export const MATERIAL_SUPPLY_COMPARE_POLICY = "material_supply.draft_compare.v1";

export type SupplierOfferForCompare = {
  id: string;
  supplier_name: string;
  unit_price_minor: string;
  coverage_quantity: string | null;
  stock_status: string;
  quote_dated_at: string;
  quote_expires_at: string | null;
  provenance_note: string | null;
};

export type OfferCompareRow = {
  offer_id: string;
  supplier_name: string;
  line_total_minor: string | null;
  rank: number | null;
  issues: string[];
  stock_status: string;
  quote_dated_at: string;
  quote_expires_at: string | null;
};

export type DraftComparisonResult = {
  policy_version: typeof MATERIAL_SUPPLY_COMPARE_POLICY;
  billable_quantity: string;
  ranked: OfferCompareRow[];
  issues: string[];
};

function isExpired(expiresAt: string | null, asOf: string): boolean {
  if (!expiresAt) return false;
  return expiresAt < asOf;
}

/**
 * Pure draft comparison of supplier offers for one material need quantity.
 * Reuses priceLineTotalMinor — no second calculator. Unknown stock is never "available".
 */
export function compareSupplierOfferDrafts(input: {
  billableQuantity: string;
  defaultCoverage: string | null;
  offers: readonly SupplierOfferForCompare[];
  asOfDate: string;
}): DraftComparisonResult {
  const issues: string[] = [];
  if (!/^(0|[1-9][0-9]*)\.[0-9]{6}$/.test(input.billableQuantity)) {
    return {
      policy_version: MATERIAL_SUPPLY_COMPARE_POLICY,
      billable_quantity: input.billableQuantity,
      ranked: [],
      issues: ["invalid_billable_quantity"],
    };
  }
  if (input.offers.length < 2) {
    issues.push("need_at_least_two_offers");
  }

  const scored: OfferCompareRow[] = [];
  for (const offer of input.offers) {
    const rowIssues: string[] = [];
    if (!offer.provenance_note || !offer.provenance_note.trim()) {
      rowIssues.push("missing_provenance");
    }
    if (offer.stock_status === "unknown") {
      rowIssues.push("stock_unknown_not_available");
    }
    if (isExpired(offer.quote_expires_at, input.asOfDate)) {
      rowIssues.push("quote_expired");
    }
    const coverage =
      offer.coverage_quantity && offer.coverage_quantity.trim()
        ? offer.coverage_quantity.trim()
        : input.defaultCoverage;
    if (!coverage) {
      rowIssues.push("coverage_missing");
    }

    let lineTotal: string | null = null;
    if (coverage && !rowIssues.includes("coverage_missing")) {
      try {
        lineTotal = priceLineTotalMinor(offer.unit_price_minor, coverage, input.billableQuantity);
      } catch {
        rowIssues.push("line_total_invalid");
      }
    }

    scored.push({
      offer_id: offer.id,
      supplier_name: offer.supplier_name,
      line_total_minor: lineTotal,
      rank: null,
      issues: rowIssues,
      stock_status: offer.stock_status,
      quote_dated_at: offer.quote_dated_at,
      quote_expires_at: offer.quote_expires_at,
    });
  }

  const sortable = scored
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.line_total_minor !== null && !row.issues.includes("quote_expired"));
  sortable.sort((a, b) => {
    const left = BigInt(a.row.line_total_minor!);
    const right = BigInt(b.row.line_total_minor!);
    if (left === right) return a.index - b.index;
    return left < right ? -1 : 1;
  });
  sortable.forEach(({ row }, rankZero) => {
    row.rank = rankZero + 1;
  });

  return {
    policy_version: MATERIAL_SUPPLY_COMPARE_POLICY,
    billable_quantity: input.billableQuantity,
    ranked: scored,
    issues,
  };
}
