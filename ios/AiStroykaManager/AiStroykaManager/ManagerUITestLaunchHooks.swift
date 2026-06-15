//
//  ManagerUITestLaunchHooks.swift
//  AiStroykaManager
//
//  When `AISTROYKA_UI_TEST=1`, normalize cold start for XCTest: finish intro gate and
//  clear auth so ManagerLoginView is shown deterministically.
//

import Foundation
import Shared

enum ManagerUITestLaunchHooks {
    static var isEnabled: Bool {
        ProcessInfo.processInfo.environment["AISTROYKA_UI_TEST"] == "1"
    }

    static var isE2EEnabled: Bool {
        ProcessInfo.processInfo.environment["AISTROYKA_E2E"] == "1"
            || ProcessInfo.processInfo.arguments.contains("-AISTROYKA_E2E")
    }

    /// When set with `AISTROYKA_E2E=1`, opens project detail via sheet (skips projects list in UITest).
    static var e2eProjectId: String? {
        guard isE2EEnabled else { return nil }
        let env = ProcessInfo.processInfo.environment["AISTROYKA_E2E_PROJECT_ID"]?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !env.isEmpty { return env }
        let args = ProcessInfo.processInfo.arguments
        if let idx = args.firstIndex(of: "-AISTROYKA_E2E_PROJECT_ID"), idx + 1 < args.count {
            let raw = args[idx + 1].trimmingCharacters(in: .whitespacesAndNewlines)
            if !raw.isEmpty { return raw }
        }
        let iosEnv = ProcessInfo.processInfo.environment["IOS_E2E_PROJECT_ID"]?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return iosEnv.isEmpty ? nil : iosEnv
    }

    @MainActor
    static func prepareManagerSurfaceIfNeeded(sessionState: ManagerSessionState) async {
        if isE2EEnabled {
            ManagerOnboardingPreferences.markIntroCompleted()
            await sessionState.signOut()
            return
        }
        guard isEnabled else { return }
        ManagerOnboardingPreferences.markIntroCompleted()
        await sessionState.signOut()
    }
}
