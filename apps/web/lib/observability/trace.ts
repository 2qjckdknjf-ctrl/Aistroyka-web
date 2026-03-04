/**
 * Get or create trace ID from request (x-request-id or generate).
 */

export function getOrCreateTraceId(request: Request): string {
  const id = request.headers.get("x-request-id")?.trim();
  if (id) return id;
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}`;
}
