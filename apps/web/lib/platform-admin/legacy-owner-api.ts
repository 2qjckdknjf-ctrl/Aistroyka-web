import type { NextResponse } from "next/server";
import { withLegacyOwnerApiDeprecation } from "./deprecation";

export async function delegateToPlatformApi(
  request: Request,
  handler: (request: Request) => Promise<NextResponse>
): Promise<NextResponse> {
  const response = await handler(request);
  return withLegacyOwnerApiDeprecation(response);
}
