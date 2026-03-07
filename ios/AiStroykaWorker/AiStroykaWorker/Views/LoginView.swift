//
//  LoginView.swift
//  AiStroykaWorker
//

import SwiftUI

struct LoginView: View {
    @EnvironmentObject var appState: AppState
    @FocusState private var focusedField: Field?
    @State private var email = ""
    @State private var password = ""
    @State private var loading = false
    @State private var errorMessage: String?

    private enum Field { case email, password }

    var body: some View {
        VStack(spacing: 24) {
            Text("AiStroyka Worker")
                .font(.title)
            TextField("Email", text: $email)
                .textContentType(.emailAddress)
                .autocapitalization(.none)
                .textInputAutocapitalization(.never)
                .focused($focusedField, equals: .email)
                .submitLabel(.next)
                .onSubmit { focusedField = .password }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(8)
            SecureField("Password", text: $password)
                .textContentType(.password)
                .focused($focusedField, equals: .password)
                .submitLabel(.go)
                .onSubmit { startSignIn() }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(8)
            if let msg = errorMessage {
                Text(msg)
                    .font(.caption)
                    .foregroundColor(.red)
            }
            Button(action: startSignIn) {
                if loading {
                    ProgressView()
                        .tint(.white)
                } else {
                    Text("Sign In")
                }
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(email.isEmpty || password.isEmpty ? Color.gray : Color.accentColor)
            .foregroundColor(.white)
            .cornerRadius(8)
            .disabled(loading || email.isEmpty || password.isEmpty)
        }
        .padding(32)
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
}
