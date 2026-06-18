import { notFound } from "next/navigation";
import { LiquidGlassPreviewClient } from "./LiquidGlassPreviewClient";

export const metadata = {
  title: "Liquid Glass Preview (dev)",
  robots: { index: false, follow: false },
};

/** Internal LG-1 primitive preview — not linked from marketing nav. */
export default function LiquidGlassPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <LiquidGlassPreviewClient />;
}
