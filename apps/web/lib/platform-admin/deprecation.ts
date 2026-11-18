import { NextResponse } from "next/server";
import { PLATFORM_API_PREFIX } from "./constants";

export const TENANT_ADMIN_PLATFORM_ROUTE_BODY = {
  error: "Platform admin route moved",
  code: "platform_admin_route_moved",
} as const;

/** Block legacy tenant-admin platform surfaces; point callers at platform API. */
export function deprecatedTenantAdminPlatformApiResponse(canonicalPath: string): NextResponse {
  return NextResponse.json(
    {
      ...TENANT_ADMIN_PLATFORM_ROUTE_BODY,
      canonical: `${PLATFORM_API_PREFIX}${canonicalPath}`,
    },
    {
      status: 403,
      headers: {
        Deprecation: "true",
        Link: `<${PLATFORM_API_PREFIX}${canonicalPath}>; rel="successor-version"`,
      },
    }
  );
}

export function withLegacyOwnerApiDeprecation(response: NextResponse): NextResponse {
  const headers = new Headers(response.headers);
  headers.set("Deprecation", "true");
  headers.set("Link", `<${PLATFORM_API_PREFIX}>; rel="successor-version"`);
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Temporary alias for legacy /api/v1/admin/billing|leads/* callers. */
export function withDeprecatedTenantAdminPlatformApiDeprecation(
  response: NextResponse,
  canonicalPath: string
): NextResponse {
  const headers = new Headers(response.headers);
  headers.set("Deprecation", "true");
  headers.set("Link", `<${PLATFORM_API_PREFIX}${canonicalPath}>; rel="successor-version"`);
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
