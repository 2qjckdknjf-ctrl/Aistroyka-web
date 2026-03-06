//
//  WorkerLiteApp.swift
//  WorkerLite
//
//  Phase 7.1 — Worker Lite iOS MVP. Pilot-ready.
//

import SwiftUI

@main
struct WorkerLiteApp: App {
    @UIApplicationDelegateAdaptor(WorkerLiteAppDelegate.self) var delegate
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
        }
    }
}
