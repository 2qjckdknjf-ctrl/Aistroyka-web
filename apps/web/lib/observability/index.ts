export { getOrCreateTraceId, getOrCreateRequestId, addRequestIdToResponse } from "./trace";
export { logStructured, logInfo, logWarn, logError, type LogEvent } from "./logger";
export { withRequestIdAndTiming } from "./request-timing";
export {
  captureException,
  SEVERITY_BY_CATEGORY,
  type ErrorCategory,
  type ErrorSeverity,
  type CaptureExceptionContext,
} from "./error-tracking";
export {
  logCopilotStreamComplete,
  logCopilotStreamError,
  logIntelligenceComplete,
  logIntelligenceError,
  type AIErrorKind,
} from "./ai-telemetry";
