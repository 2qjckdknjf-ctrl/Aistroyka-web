import type { Metadata } from "next";
import { RomaExecutionEngineClient } from "@/components/platform-admin/RomaExecutionEngineClient";

export const metadata: Metadata = {
  title: "ROMA QA Center · Execution Engine",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function RomaExecutionEnginePage() {
  return <RomaExecutionEngineClient />;
}
