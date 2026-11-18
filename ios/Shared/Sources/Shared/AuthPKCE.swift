//
//  AuthPKCE.swift
//  Shared
//

import CryptoKit
import Foundation

public enum AuthOAuthProvider: String, Sendable {
    case google
    case apple
}

public enum AuthOAuthError: Error, Equatable {
    case canceled
    case missingCode
    case invalidURL
    case providerError(String)
}

public enum AuthNonce {
    public static func random(length: Int = 32) -> String {
        let charset: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var result = ""
        var remaining = length
        while remaining > 0 {
            let randoms: [UInt8] = (0 ..< 16).map { _ in UInt8.random(in: 0 ... 255) }
            randoms.forEach { random in
                if remaining == 0 { return }
                if random < charset.count {
                    result.append(charset[Int(random)])
                    remaining -= 1
                }
            }
        }
        return result
    }

    public static func sha256Hex(_ input: String) -> String {
        SHA256.hash(data: Data(input.utf8)).map { String(format: "%02x", $0) }.joined()
    }
}

public struct AuthPKCE: Equatable, Sendable {
    public let verifier: String
    public let challenge: String

    public static func generate(length: Int = 64) -> AuthPKCE {
        let charset = Array("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~")
        var verifier = ""
        verifier.reserveCapacity(length)
        while verifier.count < length {
            let byte = UInt8.random(in: 0 ... 255)
            if Int(byte) < charset.count {
                verifier.append(charset[Int(byte)])
            }
        }
        return AuthPKCE(verifier: verifier, challenge: challenge(forVerifier: verifier))
    }

    public static func challenge(forVerifier verifier: String) -> String {
        let digest = SHA256.hash(data: Data(verifier.utf8))
        return Data(digest).base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }

    public static func authorizeURL(
        supabaseURL: String,
        provider: String,
        redirectTo: String,
        challenge: String
    ) throws -> URL {
        let raw = supabaseURL.trimmingCharacters(in: .whitespacesAndNewlines)
            .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard !raw.isEmpty,
              var components = URLComponents(string: "\(raw)/auth/v1/authorize") else {
            throw AuthOAuthError.invalidURL
        }
        components.queryItems = [
            URLQueryItem(name: "provider", value: provider),
            URLQueryItem(name: "redirect_to", value: redirectTo),
            URLQueryItem(name: "code_challenge", value: challenge),
            URLQueryItem(name: "code_challenge_method", value: "s256"),
        ]
        guard let url = components.url else { throw AuthOAuthError.invalidURL }
        return url
    }

    public static func authCode(fromCallback url: URL) throws -> String {
        let items = queryItems(from: url)
        if let error = items.first(where: { $0.name == "error" })?.value, !error.isEmpty {
            let detail = items.first(where: { $0.name == "error_description" })?.value
            throw AuthOAuthError.providerError(detail?.removingPercentEncoding ?? error)
        }
        if let code = items.first(where: { $0.name == "code" })?.value, !code.isEmpty {
            return code
        }
        throw AuthOAuthError.missingCode
    }

    private static func queryItems(from url: URL) -> [URLQueryItem] {
        var items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
        if let fragment = url.fragment, !fragment.isEmpty {
            var fragmentComponents = URLComponents()
            fragmentComponents.query = fragment
            items.append(contentsOf: fragmentComponents.queryItems ?? [])
        }
        return items
    }
}
