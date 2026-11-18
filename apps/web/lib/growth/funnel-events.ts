export function funnelEventForPath(pathname: string): string | null {
  const path = (pathname.split("?")[0] ?? "/").replace(/\/+$/, "") || "/";
  if (path === "/" || /^\/(en|ru|es|it)$/.test(path)) {
    return "landing_page.viewed";
  }
  if (/\/solutions(\/|$)/.test(path)) {
    return "solution.viewed";
  }
  if (/\/pricing(\/|$)/.test(path)) {
    return "pricing.viewed";
  }
  return null;
}
