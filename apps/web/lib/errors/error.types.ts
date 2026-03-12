/**
 * Centralized error types for consistent API and logging.
 * No internal stack traces exposed to clients.
 */

export type ErrorCode =
  | "validation_error"
  | "not_found"
  | "unauthorized"
  | "forbidden"
  | "conflict"
  | "rate_limited"
  | "service_unavailable"
  | "internal_error";

export interface AppErrorOptions {
  code?: ErrorCode;
  statusCode?: number;
  publicMessage?: string;
  /** Internal only; never sent to client. */
  internalMessage?: string;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly publicMessage: string;
  readonly internalMessage?: string;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = "AppError";
    this.code = options.code ?? "internal_error";
    this.statusCode = options.statusCode ?? 500;
    this.publicMessage = options.publicMessage ?? "An error occurred.";
    this.internalMessage = options.internalMessage;
  }
}
