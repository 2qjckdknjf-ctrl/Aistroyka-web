import { describe, expect, it } from "vitest";
import { compareSupplierOfferDrafts } from "./draft-comparison.engine";
import { loadFixtureSupplierOffers } from "./supplier-offer.fixture-adapter";
import { checkLiteAllowList } from "@/lib/api/lite-allow-list";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("AIS-MATERIAL-008 draft comparison engine", () => {
  it("ranks two fixture offers by line total using priceLineTotalMinor", () => {
    const asOf = "2026-10-28";
    const fixtures = loadFixtureSupplierOffers(asOf);
    const result = compareSupplierOfferDrafts({
      billableQuantity: "10.080000",
      defaultCoverage: "1.440000",
      asOfDate: asOf,
      offers: fixtures.map((offer, index) => ({
        id: `offer-${index}`,
        supplier_name: offer.supplier_name,
        unit_price_minor: offer.unit_price_minor,
        coverage_quantity: offer.coverage_quantity,
        stock_status: offer.stock_status,
        quote_dated_at: offer.quote_dated_at,
        quote_expires_at: offer.quote_expires_at,
        provenance_note: offer.provenance_note,
      })),
    });
    expect(result.policy_version).toBe("material_supply.draft_compare.v1");
    const ranked = result.ranked.filter((row) => row.rank !== null).sort((a, b) => a.rank! - b.rank!);
    expect(ranked[0]?.supplier_name).toBe("Fixture Build Supply");
    expect(ranked[0]?.line_total_minor).toBeTruthy();
    expect(result.ranked.find((row) => row.stock_status === "unknown")?.issues).toContain(
      "stock_unknown_not_available"
    );
  });

  it("flags expired quotes and missing provenance", () => {
    const result = compareSupplierOfferDrafts({
      billableQuantity: "1.000000",
      defaultCoverage: "1.000000",
      asOfDate: "2026-10-28",
      offers: [
        {
          id: "a",
          supplier_name: "A",
          unit_price_minor: "100",
          coverage_quantity: "1.000000",
          stock_status: "in_stock",
          quote_dated_at: "2026-01-01",
          quote_expires_at: "2026-01-02",
          provenance_note: "manual",
        },
        {
          id: "b",
          supplier_name: "B",
          unit_price_minor: "90",
          coverage_quantity: "1.000000",
          stock_status: "in_stock",
          quote_dated_at: "2026-10-01",
          quote_expires_at: null,
          provenance_note: null,
        },
      ],
    });
    expect(result.ranked.find((row) => row.offer_id === "a")?.issues).toContain("quote_expired");
    expect(result.ranked.find((row) => row.offer_id === "b")?.issues).toContain("missing_provenance");
  });

  it("blocks lite clients from comparison and fixture routes", () => {
    expect(
      checkLiteAllowList(
        "/api/v1/projects/p1/materials/requirement-drafts/d1/comparisons",
        "POST",
        "ios_worker"
      )
    ).not.toBeNull();
    expect(
      checkLiteAllowList(
        "/api/v1/projects/p1/materials/requirement-drafts/d1/fixture-offers",
        "POST",
        "android_lite"
      )
    ).not.toBeNull();
  });

  it("RLS migration is internal-writer only", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20261028230000_ais_material_008_draft_comparisons.sql"
      ),
      "utf8"
    );
    expect(sql).toContain("material_supply_draft_comparisons");
    expect(sql).toContain("is_internal_tenant_writer_for_tenant");
    expect(sql).toMatch(/never portal/i);
  });
});
