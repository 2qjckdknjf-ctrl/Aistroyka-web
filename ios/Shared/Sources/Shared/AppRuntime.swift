//
//  AppRuntime.swift
//  Shared
//
//  Single bootstrap for shared networking. Call once at app startup (Worker / Manager).
//

import Foundation

public enum AppRuntime {
    /// Configure `APIClient` for AiStroyka Worker. Keeps `x-client: ios_lite` (backend contract).
    public static func configureSharedNetworkingForWorker() async {
        await APIClient.shared.setClientProfile(MobileClientProfile.liteWorker.rawValue)
    }

    /// Configure `APIClient` for AiStroyka Manager.
    public static func configureSharedNetworkingForManager() async {
        await APIClient.shared.setClientProfile(MobileClientProfile.manager.rawValue)
    }

    // MARK: - Help API payloads

    /// `POST /help/hints` and `POST /help/assistant` use `LaunchRole` (`manager` | `admin` | `client` | `owner`). There is no `worker` key; field-worker apps use the manager hint pack.
    public static let helpHintsLaunchRoleForWorkerApp = "manager"

    /// Optional analytics on `POST /help/assistant/events` — server accepts any string; use `worker` to distinguish field clients.
    public static let helpAssistantEventRoleWorker = "worker"
}
