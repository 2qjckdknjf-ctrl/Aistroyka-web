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
    }

    @MainActor
    static func prepareManagerSurfaceIfNeeded(sessionState: ManagerSessionState) async {
        if isE2EEnabled {
            ManagerOnboardingPreferences.markIntroCompleted()
            return
        }
        guard isEnabled else { return }
        ManagerOnboardingPreferences.markIntroCompleted()
        await sessionState.signOut()
    }
}
