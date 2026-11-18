import XCTest
@testable import Shared

final class AuthPKCETests: XCTestCase {
    func testChallengeMatchesRFC7636AppendixB() {
        // RFC 7636 Appendix B
        let verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
        XCTAssertEqual(
            AuthPKCE.challenge(forVerifier: verifier),
            "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
        )
    }

    func testGeneratedVerifierIsUnreservedAndLongEnough() {
        let pkce = AuthPKCE.generate()
        XCTAssertGreaterThanOrEqual(pkce.verifier.count, 43)
        XCTAssertLessThanOrEqual(pkce.verifier.count, 128)
        XCTAssertEqual(pkce.challenge, AuthPKCE.challenge(forVerifier: pkce.verifier))
        XCTAssertTrue(pkce.verifier.allSatisfy { ch in
            ch.isLetter || ch.isNumber || "-._~".contains(ch)
        })
    }

    func testAuthorizeURLIncludesProviderChallengeAndRedirect() throws {
        let url = try AuthPKCE.authorizeURL(
            supabaseURL: "https://example.supabase.co",
            provider: "google",
            redirectTo: "ai.aistroyka.worker://auth-callback",
            challenge: "abcChallenge"
        )
        let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
        XCTAssertEqual(url.path, "/auth/v1/authorize")
        XCTAssertEqual(items.first(where: { $0.name == "provider" })?.value, "google")
        XCTAssertEqual(items.first(where: { $0.name == "code_challenge" })?.value, "abcChallenge")
        XCTAssertEqual(items.first(where: { $0.name == "code_challenge_method" })?.value, "s256")
        XCTAssertEqual(items.first(where: { $0.name == "redirect_to" })?.value, "ai.aistroyka.worker://auth-callback")
    }

    func testAuthCodeFromQueryCallback() throws {
        let url = URL(string: "ai.aistroyka.worker://auth-callback?code=oauth-code-1")!
        XCTAssertEqual(try AuthPKCE.authCode(fromCallback: url), "oauth-code-1")
    }

    func testAuthCodeFromFragmentCallback() throws {
        let url = URL(string: "ai.aistroyka.manager://auth-callback#code=frag-code")!
        XCTAssertEqual(try AuthPKCE.authCode(fromCallback: url), "frag-code")
    }

    func testProviderErrorFromCallback() {
        let url = URL(string: "ai.aistroyka.worker://auth-callback?error=access_denied&error_description=User%20denied")!
        XCTAssertThrowsError(try AuthPKCE.authCode(fromCallback: url)) { error in
            guard let oauth = error as? AuthOAuthError,
                  case .providerError(let message) = oauth else {
                return XCTFail("expected providerError")
            }
            XCTAssertTrue(message.contains("denied") || message.contains("access_denied"))
        }
    }

    func testMissingCodeThrows() {
        let url = URL(string: "ai.aistroyka.worker://auth-callback")!
        XCTAssertThrowsError(try AuthPKCE.authCode(fromCallback: url)) { error in
            XCTAssertEqual(error as? AuthOAuthError, .missingCode)
        }
    }

    func testSha256HexKnownVector() {
        XCTAssertEqual(
            AuthNonce.sha256Hex("abc"),
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        )
    }
}
