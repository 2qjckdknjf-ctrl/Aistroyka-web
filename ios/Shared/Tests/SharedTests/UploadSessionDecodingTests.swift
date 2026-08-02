import XCTest
@testable import Shared

final class UploadSessionDecodingTests: XCTestCase {
    func testUploadSessionDecodesUploadPathWithConvertFromSnakeCase() throws {
        let json = """
        {
          "data": {
            "id": "1126a696-b7ed-40d1-9dcd-54a6e1728ae2",
            "tenant_id": "6414f756-aa54-48f5-91e2-f852a7c1e837",
            "upload_path": "media/6414f756-aa54-48f5-91e2-f852a7c1e837/1126a696-b7ed-40d1-9dcd-54a6e1728ae2"
          }
        }
        """.data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let decoded = try decoder.decode(UploadSessionResponse.self, from: json)
        XCTAssertEqual(decoded.data?.id, "1126a696-b7ed-40d1-9dcd-54a6e1728ae2")
        XCTAssertEqual(decoded.data?.tenantId, "6414f756-aa54-48f5-91e2-f852a7c1e837")
        XCTAssertEqual(
            decoded.data?.uploadPath,
            "media/6414f756-aa54-48f5-91e2-f852a7c1e837/1126a696-b7ed-40d1-9dcd-54a6e1728ae2"
        )
    }

    func testSyncConflictBodyDecodesSnakeCaseWithConvertFromSnakeCase() throws {
        let json = """
        {"code":"cursor_conflict","must_bootstrap":true,"server_cursor":42}
        """.data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let decoded = try decoder.decode(SyncConflictBody.self, from: json)
        XCTAssertEqual(decoded.code, "cursor_conflict")
        XCTAssertEqual(decoded.mustBootstrap, true)
        XCTAssertEqual(decoded.serverCursor, 42)
    }

    /// Regression: snake_case CodingKeys + convertFromSnakeCase drops manager_note (Phase 5 resubmit).
    func testConvertFromSnakeCaseDoesNotNeedExplicitSnakeCodingKeys() throws {
        struct Sample: Decodable {
            let managerNote: String?
            let workerNote: String?
        }
        let json = """
        {"manager_note":"please revise","worker_note":"done"}
        """.data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let decoded = try decoder.decode(Sample.self, from: json)
        XCTAssertEqual(decoded.managerNote, "please revise")
        XCTAssertEqual(decoded.workerNote, "done")
    }
}
