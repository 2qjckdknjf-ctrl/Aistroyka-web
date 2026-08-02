/** True only for the exact base path or a descendant beginning with `basePath + "/"`. */
export function isSamePathOrChild(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}
