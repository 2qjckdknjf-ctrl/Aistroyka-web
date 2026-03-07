//
//  ManagerRootView.swift
//  AiStroyka Manager
//

import SwiftUI

struct ManagerRootView: View {
    @EnvironmentObject var sessionState: ManagerSessionState

    var body: some View {
        Group {
            if !sessionState.isLoggedIn {
                ManagerLoginView()
            } else if !sessionState.isAuthorizedRole, let msg = sessionState.roleFailureMessage {
                ManagerUnauthorizedView(message: msg)
            } else {
                ManagerTabShell()
            }
        }
        .onAppear {
            Task {
                await APIClient.shared.setClientProfile("ios_manager")
                await APIClient.shared.setTokenProvider { await AuthService.shared.getAccessToken() }
                sessionState.checkSession()
            }
        }
    }
}
