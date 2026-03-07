//
//  AiStroykaWorkerApp.swift
//  AiStroykaWorker
//
//  Phase 7.1 — AiStroyka Worker iOS MVP. Pilot-ready.
//

import SwiftUI

@main
struct AiStroykaWorkerApp: App {
    @UIApplicationDelegateAdaptor(AiStroykaWorkerAppDelegate.self) var delegate
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
        }
    }
}
