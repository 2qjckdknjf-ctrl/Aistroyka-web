import SwiftUI
import AuthenticationServices
import Shared

struct CustomerLoginView: View {
    @EnvironmentObject var sessionState: CustomerSessionState
    @FocusState private var focusedField: Field?
    @State private var email = ""
    @State private var password = ""
    @State private var errorMessage: String?
    @State private var isLoading = false
    @State private var appleNonce = ""

    private enum Field { case email, password }

    private var shownError: String? { errorMessage ?? sessionState.authErrorMessage }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("AISTROYKA")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(Color.white)
                Text(NSLocalizedString("cust_login_headline", comment: ""))
                    .font(.system(size: 28, weight: .semibold))
                    .foregroundStyle(Color.white)
                    .fixedSize(horizontal: false, vertical: true)
                Text(NSLocalizedString("cust_login_subhead", comment: ""))
                    .font(.system(size: 15))
                    .foregroundStyle(CustomerTokens.textSecondary)

                TextField(NSLocalizedString("cust_email_placeholder", comment: ""), text: $email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled(true)
                    .focused($focusedField, equals: .email)
                    .padding(.horizontal, 12)
                    .frame(minHeight: 48)
                    .background(Color.white.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .foregroundStyle(Color.white)
                    .accessibilityIdentifier("pilot_customer_email")

                SecureField(NSLocalizedString("cust_password_placeholder", comment: ""), text: $password)
                    .textContentType(.password)
                    .focused($focusedField, equals: .password)
                    .submitLabel(.go)
                    .onSubmit { signIn() }
                    .padding(.horizontal, 12)
                    .frame(minHeight: 48)
                    .background(Color.white.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .foregroundStyle(Color.white)
                    .accessibilityIdentifier("pilot_customer_password")

                if let err = shownError {
                    Text(err)
                        .font(.subheadline)
                        .foregroundStyle(Color.red)
                        .accessibilityIdentifier("pilot_customer_login_error")
                }

                Button(action: signIn) {
                    Text(isLoading ? NSLocalizedString("cust_signing_in", comment: "") : NSLocalizedString("cust_sign_in", comment: ""))
                        .font(.system(size: 16, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .frame(minHeight: 48)
                }
                .buttonStyle(.borderedProminent)
                .disabled(isLoading)
                .accessibilityIdentifier("pilot_customer_sign_in")

                SignInWithAppleButton(.signIn) { request in
                    appleNonce = AuthNonce.random()
                    request.requestedScopes = [.fullName, .email]
                    request.nonce = AuthNonce.sha256Hex(appleNonce)
                } onCompletion: { result in
                    handleApple(result)
                }
                .signInWithAppleButtonStyle(.whiteOutline)
                .frame(height: 48)
                .disabled(isLoading)
                .accessibilityIdentifier("pilot_customer_apple_sign_in")

                Button(action: startGoogle) {
                    Text(NSLocalizedString("cust_continue_google", comment: ""))
                        .font(.system(size: 16, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .frame(minHeight: 48)
                }
                .buttonStyle(.bordered)
                .disabled(isLoading)
                .accessibilityIdentifier("pilot_customer_google_sign_in")
            }
            .padding(24)
        }
        .background(Color.black.ignoresSafeArea())
    }

    private func signIn() {
        sessionState.clearAuthError()
        errorMessage = nil
        let emailTrimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let passwordTrimmed = password.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !emailTrimmed.isEmpty, !passwordTrimmed.isEmpty else {
            errorMessage = NSLocalizedString("cust_err_empty_credentials", comment: "")
            return
        }
        Task { @MainActor in
            isLoading = true
            defer { isLoading = false }
            do {
                try await AuthService.shared.signIn(email: emailTrimmed, password: passwordTrimmed)
                sessionState.checkSession()
            } catch let apiError as APIError {
                errorMessage = apiError.message
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func handleApple(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let auth):
            guard let credential = auth.credential as? ASAuthorizationAppleIDCredential,
                  let tokenData = credential.identityToken,
                  let idToken = String(data: tokenData, encoding: .utf8) else {
                errorMessage = NSLocalizedString("cust_err_apple_sign_in", comment: "")
                return
            }
            let fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
                .compactMap { $0 }
                .joined(separator: " ")
                .trimmingCharacters(in: .whitespacesAndNewlines)
            Task { @MainActor in
                isLoading = true
                defer { isLoading = false }
                do {
                    try await AuthService.shared.signInWithApple(
                        idToken: idToken,
                        nonce: appleNonce.isEmpty ? nil : appleNonce,
                        fullName: fullName.isEmpty ? nil : fullName
                    )
                    sessionState.checkSession()
                } catch let apiError as APIError {
                    errorMessage = apiError.message
                } catch {
                    errorMessage = error.localizedDescription
                }
            }
        case .failure(let error):
            if (error as NSError).code == ASAuthorizationError.canceled.rawValue { return }
            errorMessage = error.localizedDescription
        }
    }

    private func startGoogle() {
        errorMessage = nil
        isLoading = true
        Task { @MainActor in
            defer { isLoading = false }
            do {
                try await AuthOAuthSession.shared.signIn(provider: .google)
                sessionState.checkSession()
            } catch AuthOAuthError.canceled {
                return
            } catch let apiError as APIError {
                errorMessage = apiError.message
            } catch {
                errorMessage = NSLocalizedString("cust_err_google_sign_in", comment: "")
            }
        }
    }
}
