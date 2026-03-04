/** Typed job errors for handlers and service. No secrets in messages. */

export class JobError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = true
  ) {
    super(message);
    this.name = "JobError";
  }
}

export class JobPayloadError extends JobError {
  constructor(message: string) {
    super(message, "JOB_PAYLOAD_ERROR", false);
    this.name = "JobPayloadError";
  }
}

export class JobHandlerError extends JobError {
  constructor(message: string, retryable = true) {
    super(message, "JOB_HANDLER_ERROR", retryable);
    this.name = "JobHandlerError";
  }
}
