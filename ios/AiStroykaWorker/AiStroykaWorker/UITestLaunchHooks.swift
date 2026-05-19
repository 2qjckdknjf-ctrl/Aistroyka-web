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

    @MainActor
    static func prepareWorkerSurfaceIfNeeded(store: AppStateStoreManager, appState: AppState) async {
        guard isEnabled else { return }
        store.save { $0.hasCompletedWorkerIntro = true }
        await AuthService.shared.signOut()
        appState.isLoggedIn = false
        appState.currentUser = nil
    }
}
