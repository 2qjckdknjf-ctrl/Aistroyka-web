//
//  ManagerLoginView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct ManagerLoginView: View {
    @EnvironmentObject var sessionState: ManagerSessionState
    @StateObject private var networkMonitor = NetworkMonitor.shared
    @FocusState private var focusedField: Field?
    @State private var email = ""
    @State private var password = ""
    @State private var errorMessage: String?
    @State private var isLoading = false
    
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
                            .foregroundStyle(.red)
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
            }
            .navigationTitle(NSLocalizedString("mgr_nav_title", comment: ""))
            .navigationBarTitleDisplayMode(.inline)
        }
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
                sessionState.checkSession()
            } catch let apiError as APIError {
                errorMessage = apiError.message
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}
