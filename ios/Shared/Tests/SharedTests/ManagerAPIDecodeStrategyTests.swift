import XCTest
@testable import Shared

/// Documents the APIClient default: `JSONDecoder.keyDecodingStrategy = .convertFromSnakeCase`.
/// Explicit `case foo = "foo_bar"` then looks for the unconverted key and silently nils the field.
final class ManagerAPIDecodeStrategyTests: XCTestCase {
    private struct Compatible: Decodable {
        let projectId: String?
        let createdAt: String?
        let mediaCount: Int?
    }

    private struct BrokenKeys: Decodable {
        let projectId: String?
        let createdAt: String?
        let mediaCount: Int?
        enum CodingKeys: String, CodingKey {
            case projectId = "project_id"
            case createdAt = "created_at"
            case mediaCount = "media_count"
        }
    }

    private let payload = Data("""
        {"project_id":"p1","created_at":"2026-08-25T00:00:00Z","media_count":4}
        """.utf8)

    func testConvertFromSnakeCaseReadsCamelCaseProperties() throws {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let row = try decoder.decode(Compatible.self, from: payload)
        XCTAssertEqual(row.projectId, "p1")
        XCTAssertEqual(row.createdAt, "2026-08-25T00:00:00Z")
        XCTAssertEqual(row.mediaCount, 4)
    }

    func testSnakeCaseCodingKeysMissAfterConvertFromSnakeCase() throws {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let row = try decoder.decode(BrokenKeys.self, from: payload)
        XCTAssertNil(row.projectId)
        XCTAssertNil(row.createdAt)
        XCTAssertNil(row.mediaCount)
    }

    func testUploadSessionReadsUploadPathAfterConvertFromSnakeCase() throws {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let payload = Data("""
            {"data":{"id":"s1","upload_path":"media/t1/s1"}}
            """.utf8)
        let row = try decoder.decode(UploadSessionResponse.self, from: payload)
        XCTAssertEqual(row.data?.id, "s1")
        XCTAssertEqual(row.data?.uploadPath, "media/t1/s1")
    }
}
