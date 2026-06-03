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

    /// Live pilot E2E: skip intro but keep auth/session (credentials entered in UITest).
    static var isE2EEnabled: Bool {
        ProcessInfo.processInfo.environment["AISTROYKA_E2E"] == "1"
    }

    @MainActor
    static func prepareWorkerSurfaceIfNeeded(store: AppStateStoreManager, appState: AppState) async {
        if isE2EEnabled {
            store.save { $0.hasCompletedWorkerIntro = true }
            return
        }
        guard isEnabled else { return }
        store.save { $0.hasCompletedWorkerIntro = true }
        await AuthService.shared.signOut()
        appState.isLoggedIn = false
        appState.currentUser = nil
    }
}
