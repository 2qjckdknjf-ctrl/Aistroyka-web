//
//  AuthOAuthSession.swift
//  Shared
//

import AuthenticationServices
import Foundation
import UIKit

@MainActor
public final class AuthOAuthSession: NSObject, ASWebAuthenticationPresentationContextProviding {
    public static let shared = AuthOAuthSession()
    private var session: ASWebAuthenticationSession?

    public func signIn(provider: AuthOAuthProvider) async throws {
        let pkce = AuthPKCE.generate()
        let url = try AuthPKCE.authorizeURL(
            supabaseURL: Config.supabaseURL,
            provider: provider.rawValue,
            redirectTo: Config.oauthRedirectURL,
            challenge: pkce.challenge
        )
        let callback = try await authenticate(url: url, callbackScheme: Config.oauthCallbackScheme)
        let code = try AuthPKCE.authCode(fromCallback: callback)
        try await AuthService.shared.exchangePKCE(authCode: code, codeVerifier: pkce.verifier)
    }

    public func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        let windows = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
        return windows.first(where: \.isKeyWindow) ?? windows.first ?? ASPresentationAnchor()
    }

    private func authenticate(url: URL, callbackScheme: String) async throws -> URL {
        try await withCheckedThrowingContinuation { continuation in
            let session = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: callbackScheme
            ) { callbackURL, error in
                self.session = nil
                if let error {
                    let ns = error as NSError
                    if ns.domain == ASWebAuthenticationSessionErrorDomain,
                       ns.code == ASWebAuthenticationSessionError.canceledLogin.rawValue {
                        continuation.resume(throwing: AuthOAuthError.canceled)
                    } else {
                        continuation.resume(throwing: error)
                    }
                    return
                }
                guard let callbackURL else {
                    continuation.resume(throwing: AuthOAuthError.missingCode)
                    return
                }
                continuation.resume(returning: callbackURL)
            }
            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = false
            self.session = session
            if !session.start() {
                self.session = nil
                continuation.resume(throwing: AuthOAuthError.invalidURL)
            }
        }
    }
}
