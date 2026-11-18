//
//  ManagerLoginView.swift
//  AiStroyka Manager
//

import SwiftUI
import AuthenticationServices
import Shared

struct ManagerLoginView: View {
    @EnvironmentObject var sessionState: ManagerSessionState
    @StateObject private var networkMonitor = NetworkMonitor.shared
    @FocusState private var focusedField: Field?
    @State private var email = ""
    @State private var password = ""
    @State private var errorMessage: String?
    @State private var isLoading = false
    @State private var appleNonce = ""
    @State private var passwordStepVisible = false

    private enum Field { case email, password }

    private var alwaysShowPassword: Bool {
        ManagerUITestLaunchHooks.isEnabled || E2EAutoSignIn.isEnabled || E2EAutoSignIn.canAutoSignIn
    }

    private var showPasswordField: Bool {
        alwaysShowPassword || passwordStepVisible
    }

    private var effectiveErrorMessage: String? {
        errorMessage ?? sessionState.authErrorMessage
    }

    private var signInButtonTitle: String {
        isLoading ? NSLocalizedString("mgr_signing_in", comment: "") : NSLocalizedString("mgr_v43_continue", comment: "")
    }

    private var emailLooksValid: Bool {
        email.contains("@") && email.contains(".")
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            ManagerSiteImage(name: "DemoSiteNight", height: UIScreen.main.bounds.height * 0.52, allowDemoOnLive: true)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                .ignoresSafeArea(edges: .top)

            LinearGradient(
                colors: [ManagerV43.bg.opacity(0), ManagerV43.bg],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 0) {
                        Text("AISTROYKA")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(ManagerV43.textPrimary)
                        Text(".AI")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(ManagerV43.yellow)
                    }
                    Text(NSLocalizedString("mgr_v43_login_headline", comment: ""))
                        .font(.system(size: 28, weight: .semibold))
                        .foregroundStyle(ManagerV43.textPrimary)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(NSLocalizedString("mgr_v43_login_subhead", comment: ""))
                        .font(.system(size: 15))
                        .foregroundStyle(ManagerV43.textSecondary)
                }
                .padding(.horizontal, ManagerV43.screenX)
                .padding(.bottom, 20)

                VStack(alignment: .leading, spacing: 14) {
                    Text(NSLocalizedString("mgr_v43_login_title", comment: ""))
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(ManagerV43.textPrimary)

                    VStack(alignment: .leading, spacing: 6) {
                        Text(NSLocalizedString("mgr_v43_work_email", comment: ""))
                            .font(.caption)
                            .foregroundStyle(ManagerV43.textSecondary)
                        TextField(NSLocalizedString("mgr_email_placeholder", comment: ""), text: $email)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled(true)
                            .focused($focusedField, equals: .email)
                            .submitLabel(.next)
                            .onSubmit { focusedField = .password }
                            .accessibilityIdentifier("pilot_manager_email")
                            .foregroundStyle(ManagerV43.textPrimary)
                            .padding(.horizontal, 12)
                            .frame(minHeight: ManagerV43.touch)
                            .background(ManagerV43.elevated)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(ManagerV43.border, lineWidth: 1))
                    }

                    if emailLooksValid && ManagerV43Preview.isEnabled {
                        HStack(spacing: 12) {
                            Circle()
                                .fill(ManagerV43.dataBlue.opacity(0.2))
                                .frame(width: 40, height: 40)
                                .overlay(Text("SI").font(.caption.weight(.bold)).foregroundStyle(ManagerV43.dataBlue))
                            VStack(alignment: .leading, spacing: 2) {
                                Text(ManagerDemoCatalog.workspaceName)
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundStyle(ManagerV43.textPrimary)
                                Text(NSLocalizedString("mgr_v43_workspace_found", comment: ""))
                                    .font(.caption)
                                    .foregroundStyle(ManagerV43.success)
                            }
                            Spacer()
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(ManagerV43.dataBlue)
                        }
                        .padding(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(ManagerV43.dataBlue, lineWidth: 1))
                        .accessibilityElement(children: .combine)
                    } else if emailLooksValid {
                        Text(NSLocalizedString("mgr_v43_workspace_hint", comment: ""))
                            .font(.caption)
                            .foregroundStyle(ManagerV43.textSecondary)
                    }

                    if showPasswordField {
                    #if DEBUG
                    TextField(NSLocalizedString("mgr_password_placeholder", comment: ""), text: $password)
                        .textContentType(.password)
                        .focused($focusedField, equals: .password)
                        .submitLabel(.go)
                        .onSubmit { signIn() }
                        .accessibilityIdentifier("pilot_manager_password")
                        .foregroundStyle(ManagerV43.textPrimary)
                        .padding(.horizontal, 12)
                        .frame(minHeight: ManagerV43.touch)
                        .background(ManagerV43.elevated)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(ManagerV43.border, lineWidth: 1))
                    #else
                    SecureField(NSLocalizedString("mgr_password_placeholder", comment: ""), text: $password)
                        .textContentType(.password)
                        .focused($focusedField, equals: .password)
                        .submitLabel(.go)
                        .onSubmit { signIn() }
                        .accessibilityIdentifier("pilot_manager_password")
                        .foregroundStyle(ManagerV43.textPrimary)
                        .padding(.horizontal, 12)
                        .frame(minHeight: ManagerV43.touch)
                        .background(ManagerV43.elevated)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(ManagerV43.border, lineWidth: 1))
                    #endif
                    }

                    if !networkMonitor.isConnected {
                        ManagerV43OfflineBanner()
                    }
                    if let err = effectiveErrorMessage {
                        Text(err)
                            .font(.subheadline)
                            .foregroundStyle(ManagerSemanticColors.error)
                            .accessibilityIdentifier("pilot_manager_login_error")
                    }

                    ManagerV43PrimaryButton(
                        title: signInButtonTitle,
                        systemImage: isLoading ? nil : "arrow.right",
                        enabled: !isLoading && !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && (!showPasswordField || !password.isEmpty) && networkMonitor.isConnected,
                        loading: isLoading,
                        action: primaryAction
                    )
                    .accessibilityIdentifier("pilot_manager_sign_in")

                    HStack {
                        Rectangle().fill(ManagerV43.border).frame(height: 1)
                        Text(NSLocalizedString("mgr_v43_or", comment: ""))
                            .font(.caption)
                            .foregroundStyle(ManagerV43.textSecondary)
                        Rectangle().fill(ManagerV43.border).frame(height: 1)
                    }

                    SignInWithAppleButton(.signIn) { request in
                        appleNonce = AuthNonce.random()
                        request.requestedScopes = [.fullName, .email]
                        request.nonce = AuthNonce.sha256Hex(appleNonce)
                    } onCompletion: { result in
                        handleAppleSignIn(result)
                    }
                    .signInWithAppleButtonStyle(.whiteOutline)
                    .frame(height: ManagerV43.touch)
                    .disabled(isLoading)
                    .accessibilityIdentifier("pilot_manager_apple_sign_in")

                    Button(action: startGoogleSignIn) {
                        HStack(spacing: 8) {
                            Image(systemName: "g.circle")
                            Text(NSLocalizedString("mgr_v43_continue_google", comment: ""))
                                .font(.system(size: 16, weight: .semibold))
                        }
                        .foregroundStyle(ManagerV43.textPrimary)
                        .frame(maxWidth: .infinity)
                        .frame(minHeight: ManagerV43.touch)
                        .overlay(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .stroke(ManagerV43.border, lineWidth: 1.5)
                        )
                    }
                    .buttonStyle(.plain)
                    .disabled(isLoading)
                    .accessibilityIdentifier("pilot_manager_google_sign_in")

                    HStack(spacing: 6) {
                        Image(systemName: "lock.shield")
                            .foregroundStyle(ManagerV43.dataBlue)
                        Text(NSLocalizedString("mgr_v43_login_secure", comment: ""))
                            .font(.caption)
                            .foregroundStyle(ManagerV43.textSecondary)
                    }
                }
                .padding(20)
                .background(ManagerV43.elevated)
                .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
            }
            .padding(.horizontal, 12)
            .padding(.bottom, 12)
        }
        .background(ManagerV43.bg.ignoresSafeArea())
        .preferredColorScheme(.dark)
        .onAppear {
            if E2EAutoSignIn.isEnabled {
                if email.isEmpty, let e = E2EAutoSignIn.email { email = e }
                if password.isEmpty, let p = E2EAutoSignIn.password { password = p }
            } else {
                applyE2EAutoSignInIfNeeded()
            }
        }
    }

    private func applyE2EAutoSignInIfNeeded() {
        guard !E2EAutoSignIn.isEnabled else { return }
        guard E2EAutoSignIn.canAutoSignIn, !isLoading, !sessionState.isAuthorizedRole else { return }
        guard let e = E2EAutoSignIn.email, let p = E2EAutoSignIn.password else { return }
        email = e
        password = p
        signIn()
    }

    private func primaryAction() {
        if !showPasswordField {
            guard emailLooksValid else {
                errorMessage = NSLocalizedString("mgr_err_empty_credentials", comment: "")
                return
            }
            passwordStepVisible = true
            focusedField = .password
            return
        }
        signIn()
    }

    private func signIn() {
        focusedField = nil
        sessionState.clearAuthError()
        errorMessage = nil
        let emailTrimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let passwordTrimmed = password.trimmingCharacters(in: .whitespacesAndNewlines)
        email = emailTrimmed
        password = passwordTrimmed
        guard !emailTrimmed.isEmpty, !passwordTrimmed.isEmpty else {
            errorMessage = NSLocalizedString("mgr_err_empty_credentials", comment: "")
            return
        }
        guard networkMonitor.isConnected else {
            errorMessage = NSLocalizedString("mgr_err_offline_signin", comment: "")
            return
        }
        Task { @MainActor in
            errorMessage = nil
            isLoading = true
            defer { isLoading = false }
            do {
                try await AuthService.shared.signIn(email: emailTrimmed, password: passwordTrimmed)
                if E2EAutoSignIn.isEnabled {
                    await sessionState.checkSessionAndWait(maxAttempts: 40)
                } else {
                    sessionState.checkSession()
                }
            } catch let apiError as APIError {
                errorMessage = apiError.message
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func handleAppleSignIn(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let auth):
            guard let credential = auth.credential as? ASAuthorizationAppleIDCredential,
                  let tokenData = credential.identityToken,
                  let idToken = String(data: tokenData, encoding: .utf8) else {
                errorMessage = NSLocalizedString("mgr_err_apple_sign_in", comment: "")
                return
            }
            let fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
                .compactMap { $0 }
                .joined(separator: " ")
                .trimmingCharacters(in: .whitespacesAndNewlines)
            Task { @MainActor in
                errorMessage = nil
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
            if (error as NSError).code == ASAuthorizationError.canceled.rawValue {
                return
            }
            errorMessage = error.localizedDescription
        }
    }

    private func startGoogleSignIn() {
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
                errorMessage = NSLocalizedString("mgr_err_google_sign_in", comment: "")
            }
        }
    }
}
