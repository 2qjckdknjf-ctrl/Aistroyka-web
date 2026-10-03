import Foundation
import Shared

@MainActor
final class CustomerSessionState: ObservableObject {
    @Published var isLoggedIn = false
    @Published var isAuthorizedRole = false
    @Published var isCheckingSession = false
    @Published var canRetryRoleCheck = false
    @Published var authErrorMessage: String?
    @Published var roleFailureMessage: String?
    @Published var signedInEmail: String?

    private var unauthorizedObserver: NSObjectProtocol?

    init() {
        unauthorizedObserver = NotificationCenter.default.addObserver(
            forName: .apiClientDidReceiveUnauthorized,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard let self else { return }
            let profile = notification.userInfo?["clientProfile"] as? String
            guard profile == MobileClientProfile.customer.rawValue else { return }
            Task { await self.handleUnauthorizedFromAPI() }
        }
    }

    deinit {
        if let unauthorizedObserver {
            NotificationCenter.default.removeObserver(unauthorizedObserver)
        }
    }

    func clearAuthError() {
        authErrorMessage = nil
    }

    func checkSession() {
        Task { await runSessionCheck() }
    }

    func signOut() async {
        await AuthService.shared.signOut()
        isLoggedIn = false
        isAuthorizedRole = false
        canRetryRoleCheck = false
        signedInEmail = nil
        roleFailureMessage = nil
        authErrorMessage = nil
    }

    private func handleUnauthorizedFromAPI() async {
        await signOut()
        authErrorMessage = NSLocalizedString("cust_err_session_expired", comment: "")
    }

    private func runSessionCheck() async {
        isCheckingSession = true
        defer { isCheckingSession = false }
        roleFailureMessage = nil
        guard await AuthService.shared.getAccessToken() != nil else {
            isLoggedIn = false
            isAuthorizedRole = false
            canRetryRoleCheck = false
            return
        }
        isLoggedIn = true
        do {
            let me = try await CustomerAPI.me()
            signedInEmail = me.data?.email
            let role = me.data?.role
            if CustomerAuthGate.allowsCustomerSession(role: role) {
                isAuthorizedRole = true
                canRetryRoleCheck = false
                authErrorMessage = nil
                return
            }
            isAuthorizedRole = false
            canRetryRoleCheck = false
            if CustomerAuthGate.contractorRoleUsingWrongApp(role) {
                roleFailureMessage = NSLocalizedString("cust_err_use_manager", comment: "")
            } else {
                roleFailureMessage = NSLocalizedString("cust_err_not_customer", comment: "")
            }
        } catch let error as APIError where error.isUnauthorized {
            await AuthService.shared.signOut()
            isLoggedIn = false
            isAuthorizedRole = false
            canRetryRoleCheck = false
            roleFailureMessage = nil
            authErrorMessage = NSLocalizedString("cust_err_session_expired", comment: "")
        } catch {
            isAuthorizedRole = false
            canRetryRoleCheck = true
            if let apiError = error as? APIError {
                roleFailureMessage = apiError.message
            } else {
                roleFailureMessage = error.localizedDescription
            }
        }
    }
}
