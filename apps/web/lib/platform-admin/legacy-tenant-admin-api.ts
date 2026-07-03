import type { NextResponse } from "next/server";
import { withDeprecatedTenantAdminPlatformApiDeprecation } from "./deprecation";

export async function delegateLegacyTenantAdminPlatformApi(
  request: Request,
  canonicalPath: string,
  handler: (request: Request) => Promise<NextResponse>
): Promise<NextResponse> {
  const response = await handler(request);
  return withDeprecatedTenantAdminPlatformApiDeprecation(response, canonicalPath);
}
