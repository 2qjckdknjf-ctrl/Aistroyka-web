/**
 * Manual/fixture baseline for AIS-MATERIAL-008 Search & Fetch path.
 * No outbound HTTP. Live supplier APIs remain a separate BLOCKED_EXTERNAL slice.
 */

export type FixtureSupplierOffer = {
  supplier_name: string;
  sku: string | null;
  package_label: string | null;
  unit_price_minor: string;
  coverage_quantity: string;
  region: string | null;
  stock_status: "unknown" | "in_stock" | "out_of_stock" | "lead_time";
  lead_time_days: number | null;
  quote_dated_at: string;
  quote_expires_at: string | null;
  provenance_note: string;
};

/** Two deterministic EUR fixture offers for local comparison rehearsal. */
export function loadFixtureSupplierOffers(asOfDate: string): readonly FixtureSupplierOffer[] {
  return [
    {
      supplier_name: "Fixture Tile Co",
      sku: "FT-600-WHITE",
      package_label: "box 1.44 m2",
      unit_price_minor: "2500",
      coverage_quantity: "1.440000",
      region: "ES-MD",
      stock_status: "unknown",
      lead_time_days: null,
      quote_dated_at: asOfDate,
      quote_expires_at: null,
      provenance_note: "fixture:manual_baseline_v1",
    },
    {
      supplier_name: "Fixture Build Supply",
      sku: "FBS-TILE-A",
      package_label: "box 1.44 m2",
      unit_price_minor: "1999",
      coverage_quantity: "1.440000",
      region: "ES-MD",
      stock_status: "in_stock",
      lead_time_days: 3,
      quote_dated_at: asOfDate,
      quote_expires_at: null,
      provenance_note: "fixture:manual_baseline_v1",
    },
  ] as const;
}
