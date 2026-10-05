import Foundation
import Shared

@MainActor
final class CustomerSessionState: ObservableObject {
    @Published var isLoggedIn = false
    @Published var isAuthorizedRole = false
    @Published var isCheckingSession = false
    @Published var authErrorMessage: String?
    @Published var roleFailureMessage: String?
    @Published var sessionCheckFailed = false
    @Published var signedInEmail: String?
    @Published var tenantId: String?

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
        signedInEmail = nil
        tenantId = nil
        roleFailureMessage = nil
        sessionCheckFailed = false
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
        sessionCheckFailed = false
        guard await AuthService.shared.getAccessToken() != nil else {
            isLoggedIn = false
            isAuthorizedRole = false
            tenantId = nil
            return
        }
        isLoggedIn = true
        do {
            let me = try await CustomerAPI.me()
            signedInEmail = me.data?.email
            let role = me.data?.role
            if CustomerAuthGate.allowsCustomerSession(role: role) {
                isAuthorizedRole = true
                tenantId = me.data?.tenant_id
                authErrorMessage = nil
                return
            }
            isAuthorizedRole = false
            tenantId = nil
            if CustomerAuthGate.contractorRoleUsingWrongApp(role) {
                roleFailureMessage = NSLocalizedString("cust_err_use_manager", comment: "")
            } else {
                roleFailureMessage = NSLocalizedString("cust_err_not_customer", comment: "")
            }
        } catch {
            isAuthorizedRole = false
            tenantId = nil
            sessionCheckFailed = true
            authErrorMessage = NSLocalizedString("cust_err_session_retry", comment: "")
        }
    }
}
