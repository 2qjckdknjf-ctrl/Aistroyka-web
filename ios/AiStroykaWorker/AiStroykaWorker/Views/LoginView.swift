//
//  LoginView.swift
//  AiStroykaWorker
//

import SwiftUI
import AuthenticationServices
import Shared

struct LoginView: View {
    @EnvironmentObject var appState: AppState
    @FocusState private var focusedField: Field?
    @State private var email = ""
    @State private var password = ""
    @State private var phone = ""
    @State private var otp = ""
    @State private var otpSent = false
    @State private var loading = false
    @State private var errorMessage: String?
    @State private var appleNonce = ""
    @State private var showQR = false

    private enum Field { case email, password, phone, otp }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                header
                formCard
                if let msg = errorMessage ?? appState.bootstrapAuthError {
                    Text(msg)
                        .font(.caption)
                        .foregroundColor(WorkerSemanticColors.error)
                        .accessibilityIdentifier("pilot_worker_login_error")
                }
                legal
            }
            .padding(WorkerV43.screenX)
            .padding(.bottom, 24)
        }
        .background(WorkerV43.bg.ignoresSafeArea())
        .sheet(isPresented: $showQR) {
            QRScannerView(
                onToken: { token in
                    var settings = WorkerSettingsStore.load()
                    settings.pendingInviteToken = token
                    WorkerSettingsStore.save(settings)
                    errorMessage = NSLocalizedString("wrk_v43_qr_saved", comment: "")
                },
                onInvalid: { errorMessage = $0 }
            )
        }
        .onAppear {
            if E2EAutoSignIn.isEnabled {
                if email.isEmpty, let e = E2EAutoSignIn.email { email = e }
                if password.isEmpty, let p = E2EAutoSignIn.password { password = p }
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 0) {
                Text("AISTROYKA")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(WorkerV43.textPrimary)
                Text(".AI")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(WorkerV43.yellow)
            }
            WorkerV43HeroPhoto(height: 176, systemImage: "person.fill") {
                VStack(alignment: .leading, spacing: 8) {
                    Text(NSLocalizedString("wrk_v43_login_hero", comment: ""))
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundStyle(WorkerV43.textPrimary)
                    Text(NSLocalizedString("wrk_v43_login_hero_sub", comment: ""))
                        .font(.system(size: 15))
                        .foregroundStyle(WorkerV43.textSecondary)
                }
            }
        }
    }

    private var formCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(NSLocalizedString("wrk_v43_login_title", comment: ""))
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(WorkerV43.textPrimary)

            if Config.phoneOtpEnabled {
                phoneOtpBlock
                HStack {
                    Rectangle().fill(WorkerV43.border).frame(height: 1)
                    Text(NSLocalizedString("wrk_v43_or", comment: ""))
                        .font(.caption)
                        .foregroundStyle(WorkerV43.textSecondary)
                    Rectangle().fill(WorkerV43.border).frame(height: 1)
                }
            }

            WorkerV43OutlineButton(
                title: NSLocalizedString("wrk_v43_scan_qr", comment: ""),
                systemImage: "qrcode.viewfinder",
                tint: WorkerV43.cyan
            ) { showQR = true }
            .accessibilityIdentifier("pilot_worker_scan_qr")

            emailBlock

            SignInWithAppleButton(.signIn) { request in
                appleNonce = AuthNonce.random()
                request.requestedScopes = [.fullName, .email]
                request.nonce = AuthNonce.sha256Hex(appleNonce)
            } onCompletion: { result in
                handleAppleSignIn(result)
            }
            .signInWithAppleButtonStyle(.black)
            .frame(height: 48)
            .disabled(loading)
            .accessibilityIdentifier("pilot_worker_apple_sign_in")

            WorkerV43OutlineButton(
                title: NSLocalizedString("wrk_v43_continue_google", comment: ""),
                systemImage: "g.circle",
                tint: WorkerV43.textPrimary,
                enabled: !loading
            ) { startGoogleSignIn() }
            .accessibilityIdentifier("pilot_worker_google_sign_in")

            HStack(spacing: 8) {
                Image(systemName: "checkmark.shield")
                    .foregroundStyle(WorkerV43.success)
                Text(NSLocalizedString("wrk_v43_login_audit", comment: ""))
                    .font(.system(size: 12))
                    .foregroundStyle(WorkerV43.textSecondary)
            }
        }
        .padding(16)
        .background(WorkerV43.elevated)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    @ViewBuilder
    private var phoneOtpBlock: some View {
        Text(NSLocalizedString("wrk_v43_phone_label", comment: ""))
            .font(.system(size: 13, weight: .medium))
            .foregroundStyle(WorkerV43.textSecondary)
        TextField("+7 999 123-45-67", text: $phone)
            .keyboardType(.phonePad)
            .textContentType(.telephoneNumber)
            .focused($focusedField, equals: .phone)
            .padding()
            .background(WorkerV43.cardStrong)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .foregroundStyle(WorkerV43.textPrimary)
            .accessibilityIdentifier("pilot_worker_phone")

        if otpSent {
            TextField(NSLocalizedString("wrk_v43_otp_placeholder", comment: ""), text: $otp)
                .keyboardType(.numberPad)
                .textContentType(.oneTimeCode)
                .focused($focusedField, equals: .otp)
                .padding()
                .background(WorkerV43.cardStrong)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .foregroundStyle(WorkerV43.textPrimary)
                .accessibilityIdentifier("pilot_worker_otp")
        }

        WorkerV43PrimaryButton(
            title: otpSent
                ? NSLocalizedString("wrk_v43_verify_code", comment: "")
                : NSLocalizedString("wrk_v43_get_code", comment: ""),
            systemImage: "arrow.right",
            enabled: !loading && (otpSent ? otp.count >= 4 : WorkerV43Formatters.normalizedPhone(phone) != nil),
            loading: loading,
            action: otpSent ? verifyPhone : requestPhone
        )
        .accessibilityIdentifier("pilot_worker_phone_submit")
    }

    private var emailBlock: some View {
        VStack(alignment: .leading, spacing: 10) {
            TextField(NSLocalizedString("worker_email_placeholder", comment: ""), text: $email)
                .accessibilityIdentifier("pilot_worker_email")
                .textContentType(.emailAddress)
                .autocapitalization(.none)
                .textInputAutocapitalization(.never)
                .focused($focusedField, equals: .email)
                .submitLabel(.next)
                .onSubmit { focusedField = .password }
                .padding()
                .background(WorkerSemanticColors.inputSurface)
                .cornerRadius(8)
                .foregroundStyle(WorkerV43.textPrimary)
            #if DEBUG
            TextField(NSLocalizedString("worker_password_placeholder", comment: ""), text: $password)
                .accessibilityIdentifier("pilot_worker_password")
                .textContentType(.password)
                .focused($focusedField, equals: .password)
                .submitLabel(.go)
                .onSubmit { startSignIn() }
                .padding()
                .background(WorkerSemanticColors.inputSurface)
                .cornerRadius(8)
                .foregroundStyle(WorkerV43.textPrimary)
            #else
            SecureField(NSLocalizedString("worker_password_placeholder", comment: ""), text: $password)
                .accessibilityIdentifier("pilot_worker_password")
                .textContentType(.password)
                .focused($focusedField, equals: .password)
                .submitLabel(.go)
                .onSubmit { startSignIn() }
                .padding()
                .background(WorkerSemanticColors.inputSurface)
                .cornerRadius(8)
                .foregroundStyle(WorkerV43.textPrimary)
            #endif
            Button(action: startSignIn) {
                if loading {
                    ProgressView().tint(WorkerSemanticColors.onPrimary)
                } else {
                    Text(NSLocalizedString("worker_sign_in", comment: ""))
                }
            }
            .accessibilityIdentifier("pilot_worker_sign_in")
            .frame(maxWidth: .infinity)
            .padding()
            .background(email.isEmpty || password.isEmpty ? WorkerSemanticColors.primaryDisabled : WorkerV43.yellow)
            .foregroundColor(WorkerV43.yellowInk)
            .cornerRadius(8)
            .disabled(loading || email.isEmpty || password.isEmpty)
        }
    }

    private var legal: some View {
        VStack(spacing: 8) {
            Text(NSLocalizedString("wrk_v43_login_legal", comment: ""))
                .font(.system(size: 12))
                .foregroundStyle(WorkerV43.textSecondary)
                .frame(maxWidth: .infinity)
                .multilineTextAlignment(.center)
            PublicLegalLinks(
                privacyTitle: NSLocalizedString("wrk_v43_privacy_policy", comment: ""),
                termsTitle: NSLocalizedString("wrk_v43_terms", comment: "")
            )
            .foregroundStyle(WorkerV43.dataBlue)
        }
    }

    private func requestPhone() {
        guard Config.phoneOtpEnabled else { return }
        guard let normalized = WorkerV43Formatters.normalizedPhone(phone) else {
            errorMessage = NSLocalizedString("wrk_v43_phone_invalid", comment: "")
            return
        }
        errorMessage = nil
        loading = true
        Task {
            do {
                try await AuthService.shared.requestPhoneOtp(phone: normalized)
                await MainActor.run {
                    otpSent = true
                    loading = false
                }
            } catch {
                await MainActor.run {
                    errorMessage = WorkerV43Copy.userFacing(error)
                    loading = false
                }
            }
        }
    }

    private func verifyPhone() {
        guard Config.phoneOtpEnabled else { return }
        guard let normalized = WorkerV43Formatters.normalizedPhone(phone) else { return }
        errorMessage = nil
        loading = true
        Task {
            do {
                try await AuthService.shared.verifyPhoneOtp(phone: normalized, token: otp)
                await applyPendingInviteIfNeeded()
                await MainActor.run {
                    appState.checkSession()
                    loading = false
                }
            } catch {
                await MainActor.run {
                    errorMessage = WorkerV43Copy.userFacing(error)
                    loading = false
                }
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
                await applyPendingInviteIfNeeded()
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

    private func applyPendingInviteIfNeeded() async {
        await WorkerV43API.applyPendingInviteIfNeeded()
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
                    await applyPendingInviteIfNeeded()
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

    private func startGoogleSignIn() {
        errorMessage = nil
        loading = true
        Task {
            do {
                try await AuthOAuthSession.shared.signIn(provider: .google)
                await applyPendingInviteIfNeeded()
                await MainActor.run {
                    focusedField = nil
                    appState.checkSession()
                    loading = false
                }
            } catch AuthOAuthError.canceled {
                await MainActor.run { loading = false }
            } catch {
                await MainActor.run {
                    errorMessage = (error as? APIError)?.message
                        ?? (error as? AuthOAuthError).map { _ in NSLocalizedString("wrk_v43_google_sign_in_failed", comment: "") }
                        ?? error.localizedDescription
                    loading = false
                }
            }
        }
    }
}
