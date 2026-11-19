import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isDebugDiagAllowed } from "@/lib/config";
import SmokeClient from "./SmokeClient";

export const dynamic = "force-dynamic";

export const metadata = { robots: { index: false, follow: false } };

/** Supabase connectivity smoke UI: production requires DEBUG_DIAG/ENABLE_DIAG_ROUTES and an ALLOW_DEBUG_HOSTS match. */
export default async function SmokePage() {
  if (!isDebugDiagAllowed({ headers: await headers() })) notFound();
  return <SmokeClient />;
}
