//
//  UITestLaunchHooks.swift
//  AiStroykaWorker
//
//  When `AISTROYKA_UI_TEST=1` (set only from UiTest target), normalize cold start for XCTest:
//  complete intro gate and clear auth so LoginView is shown deterministically.
//

import Foundation
import Shared

enum UITestLaunchHooks {
    static var isEnabled: Bool {
        WorkerV43LaunchFlags.isOn("AISTROYKA_UI_TEST")
            || ProcessInfo.processInfo.environment["AISTROYKA_UI_TEST"] == "preview"
    }

    /// Live pilot E2E: skip intro; optional `AISTROYKA_E2E_PROJECT_ID` auto-selects project in HomeContainerView.
    static var isE2EEnabled: Bool {
        ProcessInfo.processInfo.environment["AISTROYKA_E2E"] == "1"
            || ProcessInfo.processInfo.arguments.contains("-AISTROYKA_E2E")
    }

    /// When set with live E2E, opens report compose directly (skips home navigation flake in UITest).
    static var e2eOpenReportDraft: Bool {
        guard isE2EEnabled else { return false }
        return ProcessInfo.processInfo.environment["AISTROYKA_E2E_OPEN_REPORT_DRAFT"] == "1"
            || ProcessInfo.processInfo.arguments.contains("-AISTROYKA_E2E_OPEN_REPORT_DRAFT")
    }

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
    static func prepareWorkerSurfaceIfNeeded(store: AppStateStoreManager, appState: AppState) async {
        if isE2EEnabled {
            store.save {
                $0.hasCompletedWorkerIntro = true
                $0.draftReportId = nil
                $0.pendingUploads = []
            }
            await AuthService.shared.signOut()
            appState.isLoggedIn = false
            appState.currentUser = nil
            return
        }
        guard isEnabled else { return }
        store.save { $0.hasCompletedWorkerIntro = true }
        await AuthService.shared.signOut()
        appState.isLoggedIn = false
        appState.currentUser = nil
    }
}
