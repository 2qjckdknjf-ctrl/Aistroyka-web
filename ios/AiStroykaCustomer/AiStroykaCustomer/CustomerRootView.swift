import SwiftUI
import Shared

struct CustomerRootView: View {
    @EnvironmentObject var sessionState: CustomerSessionState

    var body: some View {
        Group {
            if sessionState.isCheckingSession {
                CustomerStatusView(kind: .loading, message: NSLocalizedString("cust_checking_session", comment: ""))
                    .accessibilityIdentifier("pilot_customer_checking_session")
            } else if !sessionState.isLoggedIn {
                CustomerLoginView()
            } else if sessionState.sessionCheckFailed {
                CustomerStatusView(
                    kind: .error,
                    message: sessionState.authErrorMessage ?? NSLocalizedString("cust_err_session_retry", comment: ""),
                    actionTitle: NSLocalizedString("cust_retry", comment: "")
                ) {
                    sessionState.checkSession()
                }
                .accessibilityIdentifier("pilot_customer_session_retry")
            } else if !sessionState.isAuthorizedRole {
                CustomerStatusView(
                    kind: .unauthorized,
                    message: sessionState.roleFailureMessage ?? NSLocalizedString("cust_err_not_customer", comment: ""),
                    actionTitle: NSLocalizedString("cust_sign_out", comment: "")
                ) {
                    Task { await sessionState.signOut() }
                }
                .accessibilityIdentifier("pilot_customer_unauthorized")
            } else {
                CustomerHomeView()
            }
        }
        .onAppear {
            Task { @MainActor in
                await AppRuntime.configureSharedNetworkingForCustomer()
                await APIClient.shared.setTokenProvider { await AuthService.shared.getAccessToken() }
                sessionState.checkSession()
            }
        }
    }
}
