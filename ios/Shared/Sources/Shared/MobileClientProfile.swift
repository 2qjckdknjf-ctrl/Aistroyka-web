//
//  MobileClientProfile.swift
//  Shared
//
//  Values must match `ClientProfile` in `apps/web/lib/tenant/tenant.types.ts`.
//  Field-worker iOS sends `ios_worker` (same allow-list as legacy `ios_lite`).
//

import Foundation

public enum MobileClientProfile: String, Sendable {
    /// Field worker (AiStroyka Worker). Canonical header; legacy `ios_lite` still accepted on the backend.
    case worker = "ios_worker"
    /// Manager / foreman app (AiStroyka Manager).
    case manager = "ios_manager"
}
