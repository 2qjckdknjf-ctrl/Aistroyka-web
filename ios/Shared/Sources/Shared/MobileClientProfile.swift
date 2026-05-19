//
//  MobileClientProfile.swift
//  Shared
//
//  Values must match `ClientProfile` in `apps/web/lib/tenant/tenant.types.ts`.
//  Field-worker iOS uses `ios_lite` so `/api/v1/*` requests pass `checkLiteAllowList` in middleware.
//

import Foundation

public enum MobileClientProfile: String, Sendable {
    /// Field worker (AiStroyka Worker). Required for lite API allow-list.
    case liteWorker = "ios_lite"
    /// Manager / foreman app (AiStroyka Manager).
    case manager = "ios_manager"
}
