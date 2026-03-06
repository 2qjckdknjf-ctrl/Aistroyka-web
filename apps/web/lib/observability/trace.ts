/**
 * Get or create trace/request ID from request (x-request-id or generate).
 */

export function getOrCreateTraceId(request: Request): string {
  const id = request.headers.get("x-request-id")?.trim();
  if (id) return id;
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}`;
}

/** Alias for correlation with response header. */
export function getOrCreateRequestId(request: Request): string {
  return getOrCreateTraceId(request);
}

/** Set x-request-id on a Response. Returns the same response for chaining. */
export function addRequestIdToResponse(response: Response, requestId: string): Response {
  response.headers.set("x-request-id", requestId);
  return response;
}
