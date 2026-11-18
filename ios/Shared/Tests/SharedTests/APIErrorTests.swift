import Foundation
import XCTest
@testable import Shared

final class APIErrorTests: XCTestCase {
    private func decode(_ body: String, status: Int = 400) -> APIError {
        APIError.from(data: Data(body.utf8), response: HTTPURLResponse(
            url: URL(string: "https://example.com/auth/v1/token")!, statusCode: status,
            httpVersion: nil, headerFields: nil))
    }

    func testPreservesAppErrorContract() {
        let error = decode(#"{"error":"Insufficient rights","code":"forbidden","msg":"Diagnostic detail"}"#, status: 403)
        XCTAssertEqual(error.message, "Insufficient rights")
        XCTAssertEqual(error.code, "forbidden")
        XCTAssertTrue(error.isForbidden)
    }

    func testSupabaseInvalidCredentialsRetainsMachineCode() {
        let error = decode(#"{"code":400,"error_code":"invalid_credentials","msg":"Invalid login credentials"}"#)
        XCTAssertEqual(error.code, "invalid_credentials")
        XCTAssertEqual(error.message, "Invalid login credentials")
        XCTAssertEqual(error.statusCode, 400)
    }

    func testOAuthDescriptionTakesPrecedenceOverErrorCategory() {
        let error = decode(#"{"error":"invalid_grant","error_description":"Session has expired"}"#)
        XCTAssertEqual(error.message, "Session has expired")
    }

    func testNonJSONRetainsSafeGenericMessageAndHTTPStatus() {
        let error = decode("<html>upstream unavailable</html>", status: 503)
        XCTAssertEqual(error.message, "Request failed")
        XCTAssertNil(error.code)
        XCTAssertTrue(error.isRetryable)
    }
}
