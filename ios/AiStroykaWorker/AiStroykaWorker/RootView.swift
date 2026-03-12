//
//  RootView.swift
//  AiStroykaWorker
//

import SwiftUI
import Shared

struct RootView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        Group {
            if appState.isLoggedIn {
                HomeContainerView()
            } else {
                LoginView()
            }
        }
        .onAppear {
            appState.checkSession()
            Task {
                await APIClient.shared.setTokenProvider { await AuthService.shared.getAccessToken() }
            }
            if appState.isLoggedIn { PushRegistrationService.registerIfNeeded() }
        }
        .onChange(of: appState.isLoggedIn) { loggedIn in
            if loggedIn { PushRegistrationService.registerIfNeeded() }
        }
    }
}
