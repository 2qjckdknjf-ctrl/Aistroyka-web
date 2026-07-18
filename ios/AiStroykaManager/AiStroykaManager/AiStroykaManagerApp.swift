//
//  AiStroykaManagerApp.swift
//  AiStroyka Manager
//
//  Primary iOS app for managers/owners/admins. Connects to common engine.
//

import SwiftUI
import Shared

@main
struct AiStroykaManagerApp: App {
    @UIApplicationDelegateAdaptor(AiStroykaManagerAppDelegate.self) private var appDelegate
    @StateObject private var sessionState = ManagerSessionState()

    init() {
        ManagerOnboardingPreferences.skipIntroIfKeychainHasSession()
    }

    var body: some Scene {
        WindowGroup {
            ManagerRootView()
                .environmentObject(sessionState)
        }
    }
}
