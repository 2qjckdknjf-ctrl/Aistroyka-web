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
        sessionCheckSequence += 1
        let sequence = sessionCheckSequence
        sessionCheckTask?.cancel()
        sessionCheckTask = Task { [weak self] in
            guard let self else { return }
            guard sequence == self.sessionCheckSequence else { return }
            isCheckingSession = true
            roleFailureMessage = nil
            let session = await AuthService.shared.currentSession()
            guard !Task.isCancelled, sequence == self.sessionCheckSequence else { return }
            if session == nil {
                isLoggedIn = false
                isAuthorizedRole = false
                canRetryRoleCheck = false
                roleFailureMessage = nil
                isCheckingSession = false
                return
            }

            let roleCheck = await fetchRoleCheckResult()
            guard !Task.isCancelled, sequence == self.sessionCheckSequence else { return }
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
