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
        ProcessInfo.processInfo.environment["AISTROYKA_UI_TEST"] == "1"
    }

    /// Live pilot E2E: skip intro; optional `AISTROYKA_E2E_PROJECT_ID` auto-selects project in HomeContainerView.
    static var isE2EEnabled: Bool {
        ProcessInfo.processInfo.environment["AISTROYKA_E2E"] == "1"
    }

    static var e2eProjectId: String? {
        guard isE2EEnabled else { return nil }
        let raw = ProcessInfo.processInfo.environment["AISTROYKA_E2E_PROJECT_ID"]?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return raw.isEmpty ? nil : raw
    }

    @MainActor
    static func prepareWorkerSurfaceIfNeeded(store: AppStateStoreManager, appState: AppState) async {
        if isE2EEnabled {
            store.save { $0.hasCompletedWorkerIntro = true }
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
