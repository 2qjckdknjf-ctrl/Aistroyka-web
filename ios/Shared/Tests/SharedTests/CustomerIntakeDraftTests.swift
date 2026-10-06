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

    func testDecodesQuestions() throws {
        let data = Data("""
        {"data":[{
          "id":"d3",
          "title":"Roof",
          "description":"Leak",
          "status":"draft",
          "questions":["When can you start?","Need scaffolding?"]
        }]}
        """.utf8)
        let drafts = try CustomerIntakeDraft.decodeListJSON(data)
        XCTAssertEqual(drafts[0].questions, ["When can you start?", "Need scaffolding?"])
    }

    func testDecodesSiteContextAndLocationLabel() throws {
        let data = Data("""
        {"data":[{
          "id":"d4",
          "title":"Facade",
          "description":"Cracks",
          "status":"draft",
          "site_context":"Apartment block",
          "requested_work_type":"repair",
          "location":{"precision":"city","label":"Milan"}
        }]}
        """.utf8)
        let drafts = try CustomerIntakeDraft.decodeListJSON(data)
        XCTAssertEqual(drafts[0].siteContext, "Apartment block")
        XCTAssertEqual(drafts[0].requestedWorkType, "repair")
        XCTAssertEqual(drafts[0].locationLabel, "Milan")
        let labels = Mirror(reflecting: drafts[0]).children.map { $0.label ?? "" }
        XCTAssertFalse(labels.contains("budgetRange"))
    }

    func testISODateValidationAndDesiredDatesDecode() throws {
        XCTAssertTrue(CustomerIntakeDraft.isISODate("2026-10-05"))
        XCTAssertFalse(CustomerIntakeDraft.isISODate("2026-13-01"))
        XCTAssertFalse(CustomerIntakeDraft.isISODate("05/10/2026"))
        let data = Data("""
        {"data":[{
          "id":"d5",
          "title":"Garden",
          "description":"Fence",
          "status":"draft",
          "desired_start":"2026-11-01",
          "desired_end":"2026-11-30"
        }]}
        """.utf8)
        let drafts = try CustomerIntakeDraft.decodeListJSON(data)
        XCTAssertEqual(drafts[0].desiredStart, "2026-11-01")
        XCTAssertEqual(drafts[0].desiredEnd, "2026-11-30")
    }

    func testDecodesBoundProjectId() throws {
        let data = Data("""
        {"data":[{
          "id":"d6",
          "title":"Annex",
          "description":"New room",
          "status":"draft",
          "project_id":"proj-9"
        }]}
        """.utf8)
        let drafts = try CustomerIntakeDraft.decodeListJSON(data)
        XCTAssertEqual(drafts[0].projectId, "proj-9")
    }

    func testMergeEditedMediaURLKeepsExtraAndMediaIdRefs() {
        let existing = [
            CustomerIntakeMediaRef(kind: "video", url: "https://cdn.example/a.mp4", mediaId: "m1"),
            CustomerIntakeMediaRef(kind: "document", mediaId: "m2"),
        ]
        let same = CustomerIntakeDraft.mergeEditedMediaURL(existing: existing, editedURL: "https://cdn.example/a.mp4")
        XCTAssertEqual(same, existing)

        let updated = CustomerIntakeDraft.mergeEditedMediaURL(existing: existing, editedURL: "https://cdn.example/b.mp4")
        XCTAssertEqual(updated[0].kind, "video")
        XCTAssertEqual(updated[0].url, "https://cdn.example/b.mp4")
        XCTAssertEqual(updated[0].mediaId, "m1")
        XCTAssertEqual(updated[1].mediaId, "m2")
    }

    func testPortalIntakePathsCarryBoundProjectAndEncodeReservedCharacters() {
        XCTAssertEqual(CustomerIntakeDraft.portalIntakeListPath(projectId: nil), "portal/intake")
        XCTAssertEqual(CustomerIntakeDraft.portalIntakeListPath(projectId: "  "), "portal/intake")
        XCTAssertEqual(
            CustomerIntakeDraft.portalIntakeListPath(projectId: "proj-9"),
            "portal/intake?project_id=proj-9"
        )
        XCTAssertEqual(
            CustomerIntakeDraft.portalIntakeSubmitPath(draftId: "d1", projectId: nil),
            "portal/intake/d1/submit"
        )
        XCTAssertEqual(
            CustomerIntakeDraft.portalIntakeSubmitPath(draftId: "d1", projectId: "a/b c"),
            "portal/intake/d1/submit?project_id=a%2Fb%20c"
        )
    }

    func testPatchEncodesClearedOptionalsAsNullAndOmitsUnchangedProject() throws {
        let patch = CustomerIntakeDraftPatch(
            title: "Kitchen",
            description: "Need remodel",
            mediaRefs: [CustomerIntakeMediaRef(kind: "image", mediaId: "m1")],
            questions: ["When?"],
            siteContext: nil,
            requestedWorkType: nil,
            locationLabel: nil,
            desiredStart: nil,
            desiredEnd: nil,
            projectId: nil
        )
        let data = try JSONEncoder().encode(patch)
        let json = String(decoding: data, as: UTF8.self)
        XCTAssertTrue(json.contains("\"site_context\":null"))
        XCTAssertTrue(json.contains("\"requested_work_type\":null"))
        XCTAssertTrue(json.contains("\"location\":null"))
        XCTAssertTrue(json.contains("\"desired_start\":null"))
        XCTAssertTrue(json.contains("\"desired_end\":null"))
        XCTAssertFalse(json.contains("project_id"))
        XCTAssertTrue(json.contains("\"media_id\""))
    }
}
