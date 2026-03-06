/**
 * Attach x-request-id to response and log request_finished with timing.
 */

import { getOrCreateRequestId, addRequestIdToResponse } from "./trace";
import { logStructured } from "./logger";

export function withRequestIdAndTiming(
  request: Request,
  response: Response,
  opts: {
    route: string;
    method: string;
    duration_ms: number;
    tenantId?: string | null;
    userId?: string | null;
  }
): Response {
  const requestId = getOrCreateRequestId(request);
  addRequestIdToResponse(response, requestId);
  logStructured({
    event: "request_finished",
    request_id: requestId,
    route: opts.route,
    method: opts.method,
    status: response.status,
    duration_ms: opts.duration_ms,
    tenantId: opts.tenantId,
    userId: opts.userId,
  });
  return response;
}
