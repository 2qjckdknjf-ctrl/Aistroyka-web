import XCTest
@testable import Shared

final class CustomerPublishedEvidenceTests: XCTestCase {
    let project = "00000000-0000-4000-8000-000000000001"
    let evidence = "00000000-0000-4000-8000-000000000002"
    func payload(projectId: String? = nil, url: String? = nil, verified: Bool = true) throws -> CustomerPublishedEvidence {
        let p = projectId ?? project
        let object: [String: Any] = ["project": ["id": p], "items": [["id": evidence, "zone_label": "Kitchen", "manager_verified": verified,
            "original_url": url ?? "/api/v1/portal/projects/\(project)/evidence/\(evidence)/original", "updated_at": "2026-10-11T12:00:00Z", "internal_cost": 500]]]
        let decoder = JSONDecoder(); decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(CustomerPublishedEvidence.self, from: JSONSerialization.data(withJSONObject: object))
    }
    func testDecodesPublicProjectionAndExactGateway() throws {
        let items = try payload().validatedItems(projectId: project)
        XCTAssertEqual(items.count, 1); XCTAssertEqual(items[0].zoneLabel, "Kitchen")
        XCTAssertEqual(try CustomerPublishedEvidence.originalRequestPath(projectId: project, evidenceId: evidence), "portal/projects/\(project)/evidence/\(evidence)/original")
    }
    func testRejectsOtherProject() throws {
        XCTAssertThrowsError(try payload(projectId: evidence).validatedItems(projectId: project))
    }
    func testRejectsRawSignedForeignOrTokenUrls() throws {
        for path in ["https://storage.test/raw.png", "https://staging.aistroyka.ai/api/v1/original", "/api/v1/portal/projects/\(project)/evidence/\(evidence)/original?token=raw"] {
            XCTAssertThrowsError(try payload(url: path).validatedItems(projectId: project))
        }
    }
    func testRejectsUnverifiedPhotoAndPathInjection() throws {
        XCTAssertThrowsError(try payload(verified: false).validatedItems(projectId: project))
        XCTAssertThrowsError(try CustomerPublishedEvidence.originalRequestPath(projectId: "https://foreign.test", evidenceId: evidence))
        XCTAssertThrowsError(try CustomerPublishedEvidence.originalRequestPath(projectId: project, evidenceId: "../other"))
    }
}

private final class PublishedPhotoProtocol: URLProtocol {
    static var respond: ((URLRequest) -> (Int, String, Data))?
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        let (status, mime, data) = Self.respond!(request)
        let response = HTTPURLResponse(url: request.url!, statusCode: status, httpVersion: nil, headerFields: ["Content-Type": mime, "Cache-Control": "no-store", "Location": status == 302 ? "https://foreign.invalid" : ""])!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: data); client?.urlProtocolDidFinishLoading(self)
    }
    override func stopLoading() {}
}

final class CustomerPublishedPhotoTransportTests: XCTestCase {
    let project = "00000000-0000-4000-8000-000000000001"
    let evidence = "00000000-0000-4000-8000-000000000002"
    func client() async -> APIClient {
        let config = URLSessionConfiguration.ephemeral; config.protocolClasses = [PublishedPhotoProtocol.self]
        let client = APIClient(session: URLSession(configuration: config))
        await client.setClientProfile("ios_customer"); await client.setTokenProvider { "synthetic-bearer" }
        return client
    }
    override func tearDown() { PublishedPhotoProtocol.respond = nil; super.tearDown() }
    func testAuthenticatedNoCacheOriginalRequest() async throws {
        PublishedPhotoProtocol.respond = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer synthetic-bearer")
            XCTAssertEqual(request.value(forHTTPHeaderField: "x-client"), "ios_customer")
            XCTAssertEqual(request.cachePolicy, .reloadIgnoringLocalCacheData)
            XCTAssertEqual(request.url?.path, "/api/v1/portal/projects/\(self.project)/evidence/\(self.evidence)/original")
            return (200, "image/png", Data("synthetic-bytes".utf8))
        }
        let data = try await client().requestPublishedPhoto(projectId: project, evidenceId: evidence)
        XCTAssertEqual(data, Data("synthetic-bytes".utf8))
    }
    func testRejectsDeniedRedirectAndUnsupportedResponses() async {
        for (status, mime, expected) in [(403, "application/json", 403), (302, "image/png", 302), (200, "text/html", 415)] {
            PublishedPhotoProtocol.respond = { _ in (status, mime, Data("{}".utf8)) }
            do { _ = try await client().requestPublishedPhoto(projectId: project, evidenceId: evidence); XCTFail("Unexpected original success") }
            catch let error as APIError { XCTAssertEqual(error.statusCode, expected) }
            catch { XCTFail("Unexpected error type") }
        }
    }
    func testRejectsIdentifierBeforeSendingCredentials() async {
        PublishedPhotoProtocol.respond = { _ in XCTFail("Unexpected network request"); return (200, "image/png", Data()) }
        do { _ = try await client().requestPublishedPhoto(projectId: project, evidenceId: "../foreign"); XCTFail("Invalid path accepted") }
        catch let error as APIError { XCTAssertEqual(error.statusCode, 400) }
        catch { XCTFail("Unexpected error type") }
    }
}
