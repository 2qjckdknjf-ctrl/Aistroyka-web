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
        return firstLaunchValue(
            envKeys: ["AISTROYKA_E2E_PROJECT_ID", "IOS_E2E_PROJECT_ID"],
            argFlag: "-AISTROYKA_E2E_PROJECT_ID"
        )
    }

    /// Exact report for Phase 5 review UITests (`pilot_manager_report_<id>`).
    static var e2eReportId: String? {
        guard isE2EEnabled else { return nil }
        return firstLaunchValue(
            envKeys: ["AISTROYKA_E2E_REPORT_ID", "IOS_E2E_REPORT_ID"],
            argFlag: "-AISTROYKA_E2E_REPORT_ID"
        )
    }

    private static func firstLaunchValue(envKeys: [String], argFlag: String) -> String? {
        for key in envKeys {
            let env = ProcessInfo.processInfo.environment[key]?
                .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            if !env.isEmpty { return env }
        }
        let args = ProcessInfo.processInfo.arguments
        if let idx = args.firstIndex(of: argFlag), idx + 1 < args.count {
            let raw = args[idx + 1].trimmingCharacters(in: .whitespacesAndNewlines)
            if !raw.isEmpty { return raw }
        }
        return nil
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
