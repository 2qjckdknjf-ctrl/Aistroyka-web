//
//  ManagerLoginView.swift
//  AiStroyka Manager
//

import SwiftUI

struct ManagerLoginView: View {
    @EnvironmentObject var sessionState: ManagerSessionState
    @State private var email = ""
    @State private var password = ""
    @State private var errorMessage: String?
    @State private var isLoading = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                    SecureField("Password", text: $password)
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
                            Text(isLoading ? "Signing in…" : "Sign in")
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .disabled(isLoading || email.isEmpty || password.isEmpty)
                }
            }
            .navigationTitle("AiStroyka Manager")
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
