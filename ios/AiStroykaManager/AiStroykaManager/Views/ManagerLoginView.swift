//
//  ManagerLoginView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct ManagerLoginView: View {
    @EnvironmentObject var sessionState: ManagerSessionState
    @State private var email = ""
    @State private var password = ""
    @State private var errorMessage: String?
    @State private var isLoading = false
    
    private var signInButtonTitle: String {
        isLoading ? NSLocalizedString("mgr_signing_in", comment: "") : NSLocalizedString("mgr_sign_in", comment: "")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField(NSLocalizedString("mgr_email_placeholder", comment: ""), text: $email)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                    SecureField(NSLocalizedString("mgr_password_placeholder", comment: ""), text: $password)
                        .textContentType(.password)
                }
                if let err = errorMessage {
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
                    .disabled(isLoading || email.isEmpty || password.isEmpty)
                }
            }
            .navigationTitle(NSLocalizedString("mgr_nav_title", comment: ""))
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private func signIn() {
        errorMessage = nil
        isLoading = true
        Task {
            do {
                try await AuthService.shared.signIn(email: email, password: password)
                sessionState.checkSession()
            } catch let e as APIError {
                errorMessage = e.message
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}
