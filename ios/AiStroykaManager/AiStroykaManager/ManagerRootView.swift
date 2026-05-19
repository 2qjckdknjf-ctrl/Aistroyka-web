//
//  ManagerRootView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct ManagerRootView: View {
    @EnvironmentObject var sessionState: ManagerSessionState

    var body: some View {
        Group {
            if sessionState.isCheckingSession {
                LoadingStateView()
            } else if !ManagerOnboardingPreferences.isIntroCompleted {
                ManagerOnboardingView {
                    sessionState.checkSession()
                }
            } else if !sessionState.isLoggedIn {
                ManagerLoginView()
            } else if !sessionState.isAuthorizedRole, let msg = sessionState.roleFailureMessage {
                ManagerUnauthorizedView(message: msg)
            } else {
                ManagerTabShell()
            }
        }
        .onAppear {
            Task { @MainActor in
                await ManagerUITestLaunchHooks.prepareManagerSurfaceIfNeeded(sessionState: sessionState)
                ManagerOnboardingPreferences.skipIntroIfKeychainHasSession()
                await AppRuntime.configureSharedNetworkingForManager()
                await APIClient.shared.setTokenProvider { await AuthService.shared.getAccessToken() }
                if ManagerOnboardingPreferences.isIntroCompleted {
                    sessionState.checkSession()
                }
            }
        }
    }
}
