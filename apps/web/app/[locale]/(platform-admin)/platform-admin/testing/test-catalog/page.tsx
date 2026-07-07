import type { Metadata } from "next";
import { RomaTestCatalogClient } from "@/components/platform-admin/RomaTestCatalogClient";

export const metadata: Metadata = {
  title: "Operations Center · Test Catalog",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function RomaTestCatalogPage() {
  return <RomaTestCatalogClient />;
}
