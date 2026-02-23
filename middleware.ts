import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getAppUrl } from "@/lib/app-url";

const PROTECTED_PREFIXES = ["/dashboard", "/projects", "/billing", "/admin"];
const AUTH_PREFIXES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const isProduction = process.env.NODE_ENV === "production";

  // www -> apex canonical redirect (production only; avoids loops by redirecting only when host starts with "www.")
  if (isProduction && host.startsWith("www.")) {
    const url = request.nextUrl;
    const target = new URL(url.pathname + url.search, getAppUrl());
    return NextResponse.redirect(target, 308);
  }

  const { pathname } = request.nextUrl;
  const { response, user } = await updateSession(request);

  const isProtected =
    pathname !== "/" &&
    (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) || pathname === "/");
  const isAuthPage = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return Response.redirect(login);
  }
  if (isAuthPage && user) {
    const next = request.nextUrl.searchParams.get("next") || "/dashboard";
    return Response.redirect(new URL(next, request.url));
  }

  // Do not cache HTML for protected routes (authenticated pages)
  const isProtectedPath =
    pathname === "/" ||
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtectedPath) {
    response.headers.set("Cache-Control", "no-store");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
