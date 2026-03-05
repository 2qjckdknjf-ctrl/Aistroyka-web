/**
 * SCIM endpoint skeleton. Returns 501 unless SCIM_ENABLED and SCIM_TOKEN configured.
 * Paths: /api/v1/scim/* (e.g. /Users, /Groups).
 */

import { NextResponse } from "next/server";
import { isScimEnabled, getScimToken } from "@/lib/platform/identity";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isScimEnabled() || !getScimToken()) {
    return NextResponse.json({ error: "SCIM not available" }, { status: 501 });
  }
  return NextResponse.json({ message: "SCIM not implemented" }, { status: 501 });
}

export async function POST() {
  if (!isScimEnabled() || !getScimToken()) {
    return NextResponse.json({ error: "SCIM not available" }, { status: 501 });
  }
  return NextResponse.json({ message: "SCIM not implemented" }, { status: 501 });
}

export async function PATCH() {
  if (!isScimEnabled() || !getScimToken()) {
    return NextResponse.json({ error: "SCIM not available" }, { status: 501 });
  }
  return NextResponse.json({ message: "SCIM not implemented" }, { status: 501 });
}

export async function DELETE() {
  if (!isScimEnabled() || !getScimToken()) {
    return NextResponse.json({ error: "SCIM not available" }, { status: 501 });
  }
  return NextResponse.json({ message: "SCIM not implemented" }, { status: 501 });
}
