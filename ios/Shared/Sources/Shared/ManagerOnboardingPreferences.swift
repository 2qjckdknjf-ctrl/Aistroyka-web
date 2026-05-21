//
//  ManagerOnboardingPreferences.swift
//  Shared
//
//  Manager app first-run intro (Worker uses `AppStateStore.hasCompletedWorkerIntro`).
//

import Foundation

public enum ManagerOnboardingPreferences {
    public static let userDefaultsKey = "aistroyka.onboarding.manager.intro.v1"

    public static var isIntroCompleted: Bool {
        UserDefaults.standard.bool(forKey: userDefaultsKey)
    }

    public static func markIntroCompleted() {
        UserDefaults.standard.set(true, forKey: userDefaultsKey)
    }

    /// Call on startup if the user already has a session token (upgrade / return visit) so intro is not shown again.
    public static func skipIntroIfKeychainHasSession() {
        if KeychainHelper.get(key: KeychainHelper.sessionTokenKey) != nil {
            markIntroCompleted()
        }
    }
}
