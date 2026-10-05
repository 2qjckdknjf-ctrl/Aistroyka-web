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
}
