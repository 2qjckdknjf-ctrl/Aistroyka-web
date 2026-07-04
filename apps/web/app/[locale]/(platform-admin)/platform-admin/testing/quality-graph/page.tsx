import type { Metadata } from "next";
import { RomaQualityGraphClient } from "@/components/platform-admin/RomaQualityGraphClient";

export const metadata: Metadata = {
  title: "ROMA QA Center · Quality Graph",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function RomaQualityGraphPage() {
  return <RomaQualityGraphClient />;
}
