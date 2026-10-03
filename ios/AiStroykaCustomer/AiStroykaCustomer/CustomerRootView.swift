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
            } else if !sessionState.isAuthorizedRole {
                CustomerStatusView(
                    kind: sessionState.canRetryRoleCheck ? .error : .unauthorized,
                    message: sessionState.roleFailureMessage ?? NSLocalizedString("cust_err_not_customer", comment: ""),
                    actionTitle: sessionState.canRetryRoleCheck
                        ? NSLocalizedString("cust_retry", comment: "")
                        : NSLocalizedString("cust_sign_out", comment: ""),
                    action: {
                        if sessionState.canRetryRoleCheck {
                            sessionState.checkSession()
                        } else {
                            Task { await sessionState.signOut() }
                        }
                    },
                    secondaryActionTitle: sessionState.canRetryRoleCheck
                        ? NSLocalizedString("cust_sign_out", comment: "")
                        : nil,
                    secondaryAction: sessionState.canRetryRoleCheck
                        ? { Task { await sessionState.signOut() } }
                        : nil
                )
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
