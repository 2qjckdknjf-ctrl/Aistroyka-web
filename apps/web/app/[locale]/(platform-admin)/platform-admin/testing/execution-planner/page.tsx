import type { Metadata } from "next";
import { RomaExecutionPlannerClient } from "@/components/platform-admin/RomaExecutionPlannerClient";

export const metadata: Metadata = {
  title: "ROMA QA Center · Execution Planner",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function RomaExecutionPlannerPage() {
  return <RomaExecutionPlannerClient />;
}
