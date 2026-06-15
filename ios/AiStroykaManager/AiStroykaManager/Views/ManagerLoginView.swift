//
//  ManagerLoginView.swift
//  AiStroyka Manager
//

import SwiftUI
import AuthenticationServices
import CryptoKit
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
    
    private enum Field { case email, password }

    private var effectiveErrorMessage: String? {
        errorMessage ?? sessionState.authErrorMessage
    }

    private var signInButtonTitle: String {
        isLoading ? NSLocalizedString("mgr_signing_in", comment: "") : NSLocalizedString("mgr_sign_in", comment: "")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField(NSLocalizedString("mgr_email_placeholder", comment: ""), text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled(true)
                        .focused($focusedField, equals: .email)
                        .submitLabel(.next)
                        .onSubmit { focusedField = .password }
                        .accessibilityIdentifier("pilot_manager_email")
                    #if DEBUG
                    // UITests / Simulator automation: SecureField is hard to drive reliably (matches Worker app).
                    TextField(NSLocalizedString("mgr_password_placeholder", comment: ""), text: $password)
                        .textContentType(.password)
                        .focused($focusedField, equals: .password)
                        .submitLabel(.go)
                        .onSubmit { signIn() }
                        .accessibilityIdentifier("pilot_manager_password")
                    #else
                    SecureField(NSLocalizedString("mgr_password_placeholder", comment: ""), text: $password)
                        .textContentType(.password)
                        .focused($focusedField, equals: .password)
                        .submitLabel(.go)
                        .onSubmit { signIn() }
                        .accessibilityIdentifier("pilot_manager_password")
                    #endif
                }
                if !networkMonitor.isConnected {
                    Section {
                        Text(NSLocalizedString("mgr_err_offline_signin", comment: ""))
                            .foregroundStyle(.secondary)
                    }
                }
                if let err = effectiveErrorMessage {
                    Section {
                        Text(err)
                            .foregroundStyle(ManagerSemanticColors.error)
                            .accessibilityIdentifier("pilot_manager_login_error")
                    }
                }
                Section {
                    Button(action: signIn) {
                        HStack {
                            if isLoading { ProgressView().scaleEffect(0.8) }
                            Text(signInButtonTitle)
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .disabled(isLoading || email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || password.isEmpty || !networkMonitor.isConnected)
                    .accessibilityIdentifier("pilot_manager_sign_in")
                }
                Section {
                    SignInWithAppleButton(.signIn) { request in
                        appleNonce = Self.randomNonce()
                        request.requestedScopes = [.fullName, .email]
                        request.nonce = Self.sha256(appleNonce)
                    } onCompletion: { result in
                        handleAppleSignIn(result)
                    }
                    .signInWithAppleButtonStyle(.black)
                    .frame(height: 48)
                    .disabled(isLoading)
                }
            }
            .navigationTitle(NSLocalizedString("mgr_nav_title", comment: ""))
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                if E2EAutoSignIn.isEnabled {
                    if email.isEmpty, let e = E2EAutoSignIn.email { email = e }
                    if password.isEmpty, let p = E2EAutoSignIn.password { password = p }
                } else {
                    applyE2EAutoSignInIfNeeded()
                }
            }
        }
    }

    private func applyE2EAutoSignInIfNeeded() {
        // ManagerRootView performs programmatic E2E sign-in; avoid duplicate attempts here.
        guard !E2EAutoSignIn.isEnabled else { return }
        guard E2EAutoSignIn.canAutoSignIn, !isLoading, !sessionState.isAuthorizedRole else { return }
        guard let e = E2EAutoSignIn.email, let p = E2EAutoSignIn.password else { return }
        email = e
        password = p
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

    private static func randomNonce(length: Int = 32) -> String {
        let charset: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var result = ""
        var remaining = length

        while remaining > 0 {
            let randoms: [UInt8] = (0 ..< 16).map { _ in UInt8.random(in: 0 ... 255) }
            randoms.forEach { random in
                if remaining == 0 {
                    return
                }
                if random < charset.count {
                    result.append(charset[Int(random)])
                    remaining -= 1
                }
            }
        }
        return result
    }

    private static func sha256(_ input: String) -> String {
        let inputData = Data(input.utf8)
        let hashedData = SHA256.hash(data: inputData)
        return hashedData.map { String(format: "%02x", $0) }.joined()
    }
}
