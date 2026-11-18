import XCTest
@testable import Shared

private final class PrivateDocumentProtocol: URLProtocol {
    static var respond: ((URLRequest) -> (Int, Data))?
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        let (status, data) = Self.respond!(request)
        let response = HTTPURLResponse(url: request.url!, statusCode: status, httpVersion: nil, headerFields: ["Content-Type": "application/pdf", "Cache-Control": "no-store"])!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: data); client?.urlProtocolDidFinishLoading(self)
    }
    override func stopLoading() {}
}

final class PrivateDocumentTransportTests: XCTestCase {
    let project = "00000000-0000-4000-8000-000000000001", document = "00000000-0000-4000-8000-000000000002"
    func client() async -> APIClient {
        let config = URLSessionConfiguration.ephemeral; config.protocolClasses = [PrivateDocumentProtocol.self]
        let client = APIClient(session: URLSession(configuration: config))
        await client.setClientProfile("ios_manager"); await client.setTokenProvider { "synthetic-bearer" }; return client
    }
    override func tearDown() { PrivateDocumentProtocol.respond = nil; super.tearDown() }
    func testUsesScopedBearerGatewayWithoutResponseCaching() async throws {
        PrivateDocumentProtocol.respond = { r in
            XCTAssertEqual(r.url?.path, "/api/v1/projects/\(self.project)/documents/\(self.document)/original")
            XCTAssertEqual(r.value(forHTTPHeaderField: "Authorization"), "Bearer synthetic-bearer")
            XCTAssertEqual(r.value(forHTTPHeaderField: "x-client"), "ios_manager")
            XCTAssertEqual(r.cachePolicy, .reloadIgnoringLocalCacheData)
            return (200, Data("synthetic-PDF-bytes".utf8))
        }
        let data = try await client().requestPrivateDocument(projectId: project, documentId: document)
        XCTAssertEqual(data, Data("synthetic-PDF-bytes".utf8))
    }
    func testDenialAndRedirectCannotBecomeSuccessfulDocumentData() async {
        for status in [403, 404, 302] {
            PrivateDocumentProtocol.respond = { _ in (status, Data("{}".utf8)) }
            do { _ = try await client().requestPrivateDocument(projectId: project, documentId: document); XCTFail("Unexpected document success") }
            catch let e as APIError { XCTAssertEqual(e.statusCode, status) }
            catch { XCTFail("Unexpected error") }
        }
    }
    func testRejectsForeignOrInjectedIdentifiersBeforeCredentialsAreSent() async {
        PrivateDocumentProtocol.respond = { _ in XCTFail("Unexpected request"); return (200, Data()) }
        do { _ = try await client().requestPrivateDocument(projectId: "https://foreign.test", documentId: document); XCTFail("Invalid path accepted") }
        catch let e as APIError { XCTAssertEqual(e.statusCode, 400) }
        catch { XCTFail("Unexpected error") }
    }
}
