//
//  ManagerSessionState.swift
//  AiStroyka Manager
//

import Foundation
import Shared

@MainActor
final class ManagerSessionState: ObservableObject {
    @Published var isLoggedIn = false
    @Published var isAuthorizedRole = false
    @Published var isCheckingSession = false
    @Published var canRetryRoleCheck = false
    @Published var roleFailureMessage: String?
    @Published var authErrorMessage: String?
    /// Live E2E: block tab shell until programmatic sign-in + token are ready (avoids 401 on first API load).
    @Published var isE2EBootstrapping = false
    @Published var signedInEmail: String?
    private var sessionCheckTask: Task<Void, Never>?
    private var sessionCheckSequence = 0
    private var unauthorizedObserver: NSObjectProtocol?

    init() {
        unauthorizedObserver = NotificationCenter.default.addObserver(
            forName: .apiClientDidReceiveUnauthorized,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard let self else { return }
            guard !ManagerUITestLaunchHooks.isE2EEnabled else { return }
            let profile = notification.userInfo?["clientProfile"] as? String
            guard profile == MobileClientProfile.manager.rawValue else { return }
            Task { await self.handleUnauthorizedFromAPI() }
        }
    }

    deinit {
        if let unauthorizedObserver {
            NotificationCenter.default.removeObserver(unauthorizedObserver)
        }
    }

    func checkSession() {
        sessionCheckTask?.cancel()
        sessionCheckTask = Task { [weak self] in
            await self?.runSessionCheck()
        }
    }

    /// Live E2E: seed credentials then poll GET /api/v1/me until manager role is confirmed.
    func establishLiveE2ESession(maxAttempts: Int = 50) async -> Bool {
        guard ManagerUITestLaunchHooks.isE2EEnabled else { return false }
        clearAuthError()
        roleFailureMessage = nil
        var lastError: String?

        if E2EAutoSignIn.hasPrefetchedSession,
           let token = E2EAutoSignIn.prefetchedAccessToken,
           let userId = E2EAutoSignIn.prefetchedUserId {
            await AuthService.shared.seedE2ESession(
                accessToken: token,
                userId: userId,
                email: E2EAutoSignIn.email
            )
            if await pollLiveE2EManagerRole(maxAttempts: 12) {
                return true
            }
            lastError = authErrorMessage
            await AuthService.shared.signOut()
        }

        if let email = E2EAutoSignIn.email, let password = E2EAutoSignIn.password {
            for attempt in 0..<4 {
                if attempt > 0 {
                    try? await Task.sleep(nanoseconds: 1_000_000_000)
                }
                do {
                    try await AuthService.shared.signIn(email: email, password: password)
                    if await pollLiveE2EManagerRole(maxAttempts: maxAttempts) {
                        return true
                    }
                    lastError = authErrorMessage
                } catch let apiError as APIError {
                    lastError = apiErrorStatusMessage(apiError)
                } catch {
                    lastError = error.localizedDescription
                }
            }
        } else if !E2EAutoSignIn.hasPrefetchedSession {
            authErrorMessage = NSLocalizedString("mgr_err_empty_credentials", comment: "")
            return false
        }

        isLoggedIn = false
        isAuthorizedRole = false
        isCheckingSession = false
        canRetryRoleCheck = false
        let base = Config.baseURL
        if let lastError {
            authErrorMessage = "\(lastError) [E2E \(base)]"
        } else {
            authErrorMessage = NSLocalizedString("mgr_err_session_expired", comment: "")
        }
        return false
    }

    private func pollLiveE2EManagerRole(maxAttempts: Int) async -> Bool {
        var lastError: String?
        for attempt in 0..<maxAttempts {
            if await AuthService.shared.getAccessToken() == nil {
                try? await Task.sleep(nanoseconds: 250_000_000)
                continue
            }
            do {
                let response = try await ManagerAPI.me()
                if let data = response.data {
                    let role = data.role?.lowercased() ?? ""
                    let allowed: Set<String> = ["owner", "admin", "member"]
                    if allowed.contains(role) {
                        isLoggedIn = true
                        isAuthorizedRole = true
                        isCheckingSession = false
                        canRetryRoleCheck = false
                        roleFailureMessage = nil
                        authErrorMessage = nil
                        return true
                    }
                    lastError = String(
                        format: NSLocalizedString("mgr_err_role_not_allowed", comment: ""),
                        role.isEmpty ? "?" : role
                    )
                } else {
                    lastError = NSLocalizedString("mgr_err_no_tenant_context", comment: "")
                }
            } catch let apiError as APIError {
                lastError = apiErrorStatusMessage(apiError)
            } catch {
                lastError = error.localizedDescription
            }
            if attempt < maxAttempts - 1 {
                try? await Task.sleep(nanoseconds: 500_000_000)
            }
        }
        if let lastError {
            authErrorMessage = lastError
        }
        return false
    }

    private func apiErrorStatusMessage(_ error: APIError) -> String {
        if let code = error.statusCode {
            return "\(error.message) (HTTP \(code))"
        }
        return error.message
    }

    /// Live E2E: await role resolution (retries transient /api/v1/me failures).
    func checkSessionAndWait(maxAttempts: Int = 40) async {
        for attempt in 0..<maxAttempts {
            await runSessionCheck()
            if isAuthorizedRole { return }
            if canRetryRoleCheck, attempt < maxAttempts - 1 {
                try? await Task.sleep(nanoseconds: 500_000_000)
                continue
            }
            return
        }
    }

    private func runSessionCheck() async {
        sessionCheckSequence += 1
        let sequence = sessionCheckSequence
        isCheckingSession = true
        roleFailureMessage = nil
        let session = await AuthService.shared.currentSession()
        guard sequence == sessionCheckSequence else { return }
        guard let session else {
            isLoggedIn = false
            isAuthorizedRole = false
            canRetryRoleCheck = false
            roleFailureMessage = nil
            signedInEmail = nil
            isCheckingSession = false
            return
        }
        signedInEmail = session.user.email

        let roleCheck = await fetchRoleCheckResult()
        guard sequence == sessionCheckSequence else { return }
        switch roleCheck {
        case .authorized:
            isLoggedIn = true
            isAuthorizedRole = true
            canRetryRoleCheck = false
            roleFailureMessage = nil
            authErrorMessage = nil
        case .unauthorized(let message):
            isLoggedIn = true
            isAuthorizedRole = false
            canRetryRoleCheck = false
            roleFailureMessage = message
            authErrorMessage = nil
        case .sessionExpired:
            await AuthService.shared.signOut()
            isLoggedIn = false
            isAuthorizedRole = false
            canRetryRoleCheck = false
            roleFailureMessage = nil
            authErrorMessage = NSLocalizedString("mgr_err_session_expired", comment: "")
        case .failed(let message):
            isLoggedIn = true
            isAuthorizedRole = false
            canRetryRoleCheck = true
            roleFailureMessage = message
        }
        isCheckingSession = false
    }

    private enum RoleCheckResult {
        case authorized
        case unauthorized(message: String)
        case sessionExpired
        case failed(message: String)
    }

    /// Manager app allows owner, admin, member (foreman). Viewer or no tenant → unauthorized.
    private func fetchRoleCheckResult() async -> RoleCheckResult {
        do {
            let r = try await ManagerAPI.me()
            guard let data = r.data else {
                return .unauthorized(message: NSLocalizedString("mgr_err_no_tenant_context", comment: ""))
            }
            guard let role = data.role?.lowercased(), !role.isEmpty else {
                return .unauthorized(message: NSLocalizedString("mgr_err_no_team_membership", comment: ""))
            }
            let allowed: Set<String> = ["owner", "admin", "member"]
            if allowed.contains(role) {
                return .authorized
            } else {
                let template = NSLocalizedString("mgr_err_role_not_allowed", comment: "")
                return .unauthorized(message: String(format: template, role))
            }
        } catch let e as APIError {
            if e.statusCode == 401 {
                // Live E2E: first /me may race token propagation — retry instead of signing out.
                if ManagerUITestLaunchHooks.isE2EEnabled {
                    return .failed(message: e.message)
                }
                return .sessionExpired
            } else {
                return .failed(message: e.message)
            }
        } catch {
            return .failed(message: error.localizedDescription)
        }
    }

    func signOut() async {
        sessionCheckSequence += 1
        sessionCheckTask?.cancel()
        try? await ManagerAPI.unregisterDevice()
        await AuthService.shared.signOut()
        isLoggedIn = false
        isCheckingSession = false
        isAuthorizedRole = false
        canRetryRoleCheck = false
        roleFailureMessage = nil
        authErrorMessage = nil
    }

    func clearAuthError() {
        authErrorMessage = nil
    }

    /// Live Layer B: await real GET /api/v1/me after programmatic sign-in (same path as production role gate).
    func awaitE2ERoleAfterSignIn(maxAttempts: Int = 10) async -> Bool {
        guard ManagerUITestLaunchHooks.isE2EEnabled else { return false }
        for attempt in 0..<maxAttempts {
            if await AuthService.shared.getAccessToken() == nil {
                try? await Task.sleep(nanoseconds: 250_000_000)
                continue
            }
            await runSessionCheck()
            if isAuthorizedRole { return true }
            if attempt < maxAttempts - 1 {
                try? await Task.sleep(nanoseconds: 500_000_000)
            }
        }
        return isAuthorizedRole
    }

    private func handleUnauthorizedFromAPI() async {
        sessionCheckSequence += 1
        sessionCheckTask?.cancel()
        await AuthService.shared.signOut()
        isLoggedIn = false
        isCheckingSession = false
        isAuthorizedRole = false
        canRetryRoleCheck = false
        roleFailureMessage = nil
        authErrorMessage = NSLocalizedString("mgr_err_session_expired", comment: "")
    }
}
