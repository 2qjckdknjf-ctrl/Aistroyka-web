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
            if let preview = DesignPreview.screen {
                DesignPreviewRoot(screen: preview, appTitle: "AiStroyka Worker")
            } else if UITestLaunchHooks.isE2EEnabled, appState.isE2EBootstrapping {
                ProgressView(NSLocalizedString("worker_signing_in", comment: ""))
                    .accessibilityIdentifier("pilot_worker_e2e_bootstrapping")
            } else if appState.isLoggedIn {
                if UITestLaunchHooks.isE2EEnabled,
                   UITestLaunchHooks.e2eOpenResubmit,
                   let reportId = UITestLaunchHooks.e2eReportId {
                    NavigationStack {
                        ReportResubmitView(reportId: reportId)
                    }
                    .accessibilityElement(children: .contain)
                    .accessibilityIdentifier("pilot_worker_e2e_resubmit_shell")
                } else if UITestLaunchHooks.isE2EEnabled,
                          UITestLaunchHooks.e2eOpenReportDraft,
                          let projectId = UITestLaunchHooks.e2eProjectId {
                    ReportCreateView(
                        projectId: projectId,
                        dayId: store.state.shift.dayId,
                        draftReportId: nil,
                        taskId: UITestLaunchHooks.e2eTaskId,
                        taskTitle: UITestLaunchHooks.e2eTaskId == nil ? nil : "Phase5 task"
                    )
                    .accessibilityElement(children: .contain)
                    .accessibilityIdentifier("pilot_worker_e2e_report_draft_shell")
                } else {
                    HomeContainerView()
                }
            } else if !store.state.hasCompletedWorkerIntro {
                WorkerOnboardingView()
            } else {
                LoginView()
            }
        }
        .brandPageChrome()
        .onAppear {
            BrandTokens.applyGlobalListChrome()
            Task { @MainActor in
                if UITestLaunchHooks.isE2EEnabled {
                    appState.isE2EBootstrapping = true
                }
                await UITestLaunchHooks.prepareWorkerSurfaceIfNeeded(store: store, appState: appState)
                await AppRuntime.configureSharedNetworkingForWorker()
                await APIClient.shared.setTokenProvider { await AuthService.shared.getAccessToken() }
                if UITestLaunchHooks.isE2EEnabled {
                    await performWorkerE2EAutoSignInIfNeeded(appState: appState)
                    if UITestLaunchHooks.e2ePauseQueue {
                        OperationQueueExecutor.shared.pauseQueue()
                    }
                    appState.isE2EBootstrapping = false
                } else {
                    appState.checkSession()
                }
                if appState.isLoggedIn { PushRegistrationService.registerIfNeeded() }
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .apiClientDidReceiveUnauthorized)) { output in
            guard !UITestLaunchHooks.isE2EEnabled else { return }
            let profile = output.userInfo?["clientProfile"] as? String
            guard profile == MobileClientProfile.worker.rawValue else { return }
            appState.logout()
        }
        .onChange(of: appState.isLoggedIn) { loggedIn in
            if loggedIn { PushRegistrationService.registerIfNeeded() }
        }
    }

    private func performWorkerE2EAutoSignInIfNeeded(appState: AppState) async {
        guard E2EAutoSignIn.canAutoSignIn else { return }
        appState.bootstrapAuthError = nil
        var lastError: String?

        if E2EAutoSignIn.hasPrefetchedSession,
           let token = E2EAutoSignIn.prefetchedAccessToken,
           let userId = E2EAutoSignIn.prefetchedUserId {
            await AuthService.shared.seedE2ESession(
                accessToken: token,
                userId: userId,
                email: E2EAutoSignIn.email
            )
            await waitForE2EAccessTokenIfNeeded()
            await appState.checkSessionAndWait()
            if appState.isLoggedIn { return }
            lastError = NSLocalizedString("worker_error_generic", comment: "")
            await AuthService.shared.signOut()
            appState.bootstrapAuthError = nil
        }

        guard let email = E2EAutoSignIn.email, let password = E2EAutoSignIn.password else {
            if let lastError { appState.bootstrapAuthError = lastError }
            return
        }

        for attempt in 0..<4 {
            if attempt > 0 {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
            }
            do {
                try await AuthService.shared.signIn(email: email, password: password)
                await waitForE2EAccessTokenIfNeeded()
                await appState.checkSessionAndWait()
                if appState.isLoggedIn { return }
                lastError = NSLocalizedString("worker_error_generic", comment: "")
            } catch let apiError as APIError {
                lastError = apiError.message
            } catch {
                lastError = error.localizedDescription
            }
        }
        if let lastError {
            appState.bootstrapAuthError = lastError
        }
    }

    private func waitForE2EAccessTokenIfNeeded() async {
        guard UITestLaunchHooks.isE2EEnabled else { return }
        for _ in 0..<40 where await AuthService.shared.getAccessToken() == nil {
            try? await Task.sleep(nanoseconds: 250_000_000)
        }
    }
}
