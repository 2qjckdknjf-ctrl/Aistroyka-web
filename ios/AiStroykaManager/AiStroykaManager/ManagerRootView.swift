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
            if let preview = DesignPreview.screen {
                DesignPreviewRoot(screen: preview, appTitle: "AiStroyka Manager")
            } else if ManagerUITestLaunchHooks.isE2EEnabled, sessionState.isE2EBootstrapping {
                LoadingStateView(message: NSLocalizedString("mgr_signing_in", comment: ""))
                    .accessibilityIdentifier("pilot_manager_e2e_bootstrapping")
            } else if sessionState.isCheckingSession {
                LoadingStateView()
                    .accessibilityIdentifier(
                        ManagerUITestLaunchHooks.isE2EEnabled ? "pilot_manager_e2e_checking_session" : ""
                    )
            } else if !ManagerOnboardingPreferences.isIntroCompleted {
                ManagerOnboardingView {
                    sessionState.checkSession()
                }
            } else if !sessionState.isLoggedIn {
                ManagerLoginView()
            } else if !sessionState.isAuthorizedRole {
                if ManagerUITestLaunchHooks.isE2EEnabled {
                    ManagerLoginView()
                } else if let msg = sessionState.roleFailureMessage {
                    ManagerUnauthorizedView(message: msg)
                } else {
                    ManagerLoginView()
                }
            } else {
                ManagerTabShell()
            }
        }
        .brandPageChrome()
        .onAppear {
            BrandTokens.applyGlobalListChrome()
            Task { @MainActor in
                if ManagerUITestLaunchHooks.isE2EEnabled {
                    sessionState.isE2EBootstrapping = true
                }
                await ManagerUITestLaunchHooks.prepareManagerSurfaceIfNeeded(sessionState: sessionState)
                ManagerOnboardingPreferences.skipIntroIfKeychainHasSession()
                await AppRuntime.configureSharedNetworkingForManager()
                await APIClient.shared.setTokenProvider { await AuthService.shared.getAccessToken() }
                if ManagerUITestLaunchHooks.isE2EEnabled {
                    await performE2EAutoSignInIfNeeded(sessionState: sessionState)
                    sessionState.isE2EBootstrapping = false
                } else if ManagerOnboardingPreferences.isIntroCompleted {
                    sessionState.checkSession()
                }
            }
        }
    }

    private func performE2EAutoSignInIfNeeded(sessionState: ManagerSessionState) async {
        guard E2EAutoSignIn.isEnabled else { return }
        _ = await sessionState.establishLiveE2ESession(maxAttempts: 50)
    }

}
