//
//  AiStroykaManagerApp.swift
//  AiStroyka Manager
//
//  Primary iOS app for managers/owners/admins. Connects to common engine.
//

import SwiftUI

@main
struct AiStroykaManagerApp: App {
    @StateObject private var sessionState = ManagerSessionState()

    var body: some Scene {
        WindowGroup {
            ManagerRootView()
                .environmentObject(sessionState)
        }
    }
}
