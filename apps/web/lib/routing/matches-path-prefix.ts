/** Exact path or nested segment — avoids `/projects` matching `/projects-showcase`. */
export function matchesPathPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}
