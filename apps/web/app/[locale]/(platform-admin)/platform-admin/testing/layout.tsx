import type { Metadata } from "next";
import { RomaQaCenterShell } from "@/components/platform-admin/RomaQaCenterShell";

export const metadata: Metadata = {
  title: "ROMA QA Center",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function RomaQaCenterLayout({ children }: { children: React.ReactNode }) {
  return <RomaQaCenterShell>{children}</RomaQaCenterShell>;
}
