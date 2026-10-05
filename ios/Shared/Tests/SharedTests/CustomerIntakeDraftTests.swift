import XCTest
@testable import Shared

final class CustomerIntakeDraftTests: XCTestCase {
    func testDecodesListWithoutTenantFinanceFields() throws {
        let data = Data("""
        {"data":[{
          "id":"d1",
          "title":"Kitchen",
          "description":"Need remodel",
          "status":"draft",
          "project_id":null,
          "updated_at":"2026-10-05T00:00:00Z",
          "tenant_id":"secret-tenant",
          "budget_range":"internal-should-still-decode-as-ignored-if-absent-from-model"
        }]}
        """.utf8)
        let drafts = try CustomerIntakeDraft.decodeListJSON(data)
        XCTAssertEqual(drafts.count, 1)
        XCTAssertEqual(drafts[0].id, "d1")
        XCTAssertEqual(drafts[0].title, "Kitchen")
        XCTAssertEqual(drafts[0].status, "draft")
        let labels = Mirror(reflecting: drafts[0]).children.map { $0.label ?? "" }
        XCTAssertFalse(labels.contains("tenantId"))
        XCTAssertFalse(labels.contains("budgetRange"))
    }

    func testDecodesMediaRefsFromSnakeCase() throws {
        let data = Data("""
        {"data":[{
          "id":"d2",
          "title":"Bath",
          "description":"Tiles",
          "status":"draft",
          "media_refs":[{"kind":"image","url":"https://cdn.example/a.jpg","media_id":"m1"}]
        }]}
        """.utf8)
        let drafts = try CustomerIntakeDraft.decodeListJSON(data)
        XCTAssertEqual(drafts[0].mediaRefs.count, 1)
        XCTAssertEqual(drafts[0].mediaRefs[0].kind, "image")
        XCTAssertEqual(drafts[0].mediaRefs[0].url, "https://cdn.example/a.jpg")
        XCTAssertEqual(drafts[0].mediaRefs[0].mediaId, "m1")
    }

    func testEncodesMediaRefsWithSnakeCaseKeys() throws {
        let ref = CustomerIntakeMediaRef(kind: "image", url: "https://cdn.example/a.jpg", mediaId: "m1")
        let data = try JSONEncoder().encode(ref)
        let json = String(decoding: data, as: UTF8.self)
        XCTAssertTrue(json.contains("\"media_id\""))
        XCTAssertFalse(json.contains("\"mediaId\""))
    }
}
