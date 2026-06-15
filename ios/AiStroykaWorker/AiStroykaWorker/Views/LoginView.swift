//
//  LoginView.swift
//  AiStroykaWorker
//

import SwiftUI
import AuthenticationServices
import CryptoKit
import Shared

struct LoginView: View {
    @EnvironmentObject var appState: AppState
    @FocusState private var focusedField: Field?
    @State private var email = ""
    @State private var password = ""
    @State private var loading = false
    @State private var errorMessage: String?
    @State private var appleNonce = ""

    private enum Field { case email, password }

    var body: some View {
        VStack(spacing: 24) {
            Text(NSLocalizedString("worker_app_title", comment: ""))
                .font(.title)
            TextField(NSLocalizedString("worker_email_placeholder", comment: ""), text: $email)
                .accessibilityIdentifier("pilot_worker_email")
                .textContentType(.emailAddress)
                .autocapitalization(.none)
                .textInputAutocapitalization(.never)
                .focused($focusedField, equals: .email)
                .submitLabel(.next)
                .onSubmit { focusedField = .password }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(8)
            #if DEBUG
            // Maestro cannot reliably fill SecureField on Simulator; use TextField in Debug for STAGE 4 pilot automation only.
            TextField(NSLocalizedString("worker_password_placeholder", comment: ""), text: $password)
                .accessibilityIdentifier("pilot_worker_password")
                .textContentType(.password)
                .focused($focusedField, equals: .password)
                .submitLabel(.go)
                .onSubmit { startSignIn() }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(8)
            #else
            SecureField(NSLocalizedString("worker_password_placeholder", comment: ""), text: $password)
                .accessibilityIdentifier("pilot_worker_password")
                .textContentType(.password)
                .focused($focusedField, equals: .password)
                .submitLabel(.go)
                .onSubmit { startSignIn() }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(8)
            #endif
            if let msg = errorMessage ?? appState.bootstrapAuthError {
                Text(msg)
                    .font(.caption)
                    .foregroundColor(.red)
                    .accessibilityIdentifier("pilot_worker_login_error")
            }
            Button(action: startSignIn) {
                if loading {
                    ProgressView()
                        .tint(.white)
                } else {
                    Text(NSLocalizedString("worker_sign_in", comment: ""))
                }
            }
            .accessibilityIdentifier("pilot_worker_sign_in")
            .frame(maxWidth: .infinity)
            .padding()
            .background(email.isEmpty || password.isEmpty ? Color.gray : Color.accentColor)
            .foregroundColor(.white)
            .cornerRadius(8)
            .disabled(loading || email.isEmpty || password.isEmpty)
            SignInWithAppleButton(.signIn) { request in
                appleNonce = Self.randomNonce()
                request.requestedScopes = [.fullName, .email]
                request.nonce = Self.sha256(appleNonce)
            } onCompletion: { result in
                handleAppleSignIn(result)
            }
            .signInWithAppleButtonStyle(.black)
            .frame(height: 48)
            .disabled(loading)
        }
        .padding(32)
        .onAppear {
            if E2EAutoSignIn.isEnabled {
                if email.isEmpty, let e = E2EAutoSignIn.email { email = e }
                if password.isEmpty, let p = E2EAutoSignIn.password { password = p }
            }
        }
    }

    private func startSignIn() {
        focusedField = nil
        signIn()
    }

    private func signIn() {
        errorMessage = nil
        loading = true
        Task {
            do {
                try await AuthService.shared.signIn(email: email, password: password)
                await MainActor.run {
                    focusedField = nil
                    appState.checkSession()
                    loading = false
                }
            } catch {
                await MainActor.run {
                    errorMessage = (error as? APIError)?.message ?? error.localizedDescription
                    loading = false
                }
            }
        }
    }

    private func handleAppleSignIn(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let auth):
            guard let credential = auth.credential as? ASAuthorizationAppleIDCredential,
                  let tokenData = credential.identityToken,
                  let idToken = String(data: tokenData, encoding: .utf8) else {
                errorMessage = NSLocalizedString("worker_apple_sign_in_failed", comment: "")
                return
            }
            let fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
                .compactMap { $0 }
                .joined(separator: " ")
                .trimmingCharacters(in: .whitespacesAndNewlines)
            loading = true
            Task {
                do {
                    try await AuthService.shared.signInWithApple(
                        idToken: idToken,
                        nonce: appleNonce.isEmpty ? nil : appleNonce,
                        fullName: fullName.isEmpty ? nil : fullName
                    )
                    await MainActor.run {
                        focusedField = nil
                        appState.checkSession()
                        loading = false
                    }
                } catch {
                    await MainActor.run {
                        errorMessage = (error as? APIError)?.message ?? error.localizedDescription
                        loading = false
                    }
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
