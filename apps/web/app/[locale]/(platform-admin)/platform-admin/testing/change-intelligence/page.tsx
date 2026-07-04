import type { Metadata } from "next";
import { RomaChangeIntelligenceClient } from "@/components/platform-admin/RomaChangeIntelligenceClient";

export const metadata: Metadata = {
  title: "ROMA QA Center · Change Intelligence",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function RomaChangeIntelligencePage() {
  return <RomaChangeIntelligenceClient />;
}
