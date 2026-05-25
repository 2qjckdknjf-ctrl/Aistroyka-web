//
//  RootView.swift
//  AiStroykaWorker
//

import SwiftUI
import Shared

struct RootView: View {
    @EnvironmentObject var appState: AppState
    @ObservedObject private var store = AppStateStoreManager.shared

    var body: some View {
        Group {
            if appState.isLoggedIn {
                HomeContainerView()
            } else if !store.state.hasCompletedWorkerIntro {
                WorkerOnboardingView()
            } else {
                LoginView()
            }
        }
        .onAppear {
            Task { @MainActor in
                await UITestLaunchHooks.prepareWorkerSurfaceIfNeeded(store: store, appState: appState)
                await AppRuntime.configureSharedNetworkingForWorker()
                await APIClient.shared.setTokenProvider { await AuthService.shared.getAccessToken() }
                appState.checkSession()
                if appState.isLoggedIn { PushRegistrationService.registerIfNeeded() }
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .apiClientDidReceiveUnauthorized)) { output in
            let profile = output.userInfo?["clientProfile"] as? String
            guard profile == MobileClientProfile.worker.rawValue else { return }
            appState.logout()
        }
        .onChange(of: appState.isLoggedIn) { loggedIn in
            if loggedIn {
                OperationQueueExecutor.shared.resumeQueue()
                PushRegistrationService.registerIfNeeded()
            }
        }
    }
}
