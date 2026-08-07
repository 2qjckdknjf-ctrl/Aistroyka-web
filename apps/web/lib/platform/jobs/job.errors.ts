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
  constructor(message: string, code: string = "JOB_PAYLOAD_ERROR") {
    super(message, code, false);
    this.name = "JobPayloadError";
  }
}

export class JobHandlerError extends JobError {
  constructor(message: string, retryable = true, code: string = "JOB_HANDLER_ERROR") {
    super(message, code, retryable);
    this.name = "JobHandlerError";
  }
}
