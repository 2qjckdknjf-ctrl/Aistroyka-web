import XCTest
@testable import Shared

final class ReportPhotoPublicationTests: XCTestCase {
    let report = "00000000-0000-4000-8000-000000000001"
    let project = "00000000-0000-4000-8000-000000000002"
    let attachment = "00000000-0000-4000-8000-000000000003"
    let media = "00000000-0000-4000-8000-000000000004"
    func state(_ patch: [String: Any] = [:], itemPatch: [String: Any] = [:]) throws -> ReportPhotoPublication.State {
        var item: [String: Any] = ["attachment_id": attachment, "media_id": media, "upload_session_id": NSNull(), "published": false,
            "sharing_enabled": false, "eligible": true, "evidence_id": NSNull(), "version": NSNull()]
        item.merge(itemPatch) { _, v in v }
        var value: [String: Any] = ["report_id": report, "project_id": project, "report_status": "approved", "portal_enabled": true, "items": [item]]
        value.merge(patch) { _, v in v }
        let decoder = JSONDecoder(); decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(ReportPhotoPublication.State.self, from: JSONSerialization.data(withJSONObject: value))
    }
    func testSelectsOnlyExactExistingAttachmentSource() throws {
        let value = try state().validated(reportId: report)
        XCTAssertEqual(value.selected(mediaId: media, uploadSessionId: nil)?.attachmentId, attachment)
        XCTAssertNil(value.selected(mediaId: project, uploadSessionId: nil)); XCTAssertNil(value.selected(mediaId: nil, uploadSessionId: nil))
    }
    func testRejectsForeignReportAndMalformedSourceIdentifiers() throws {
        XCTAssertThrowsError(try state().validated(reportId: project))
        XCTAssertThrowsError(try state(["project_id": "https://foreign.test"]).validated(reportId: report))
        XCTAssertThrowsError(try state(itemPatch: ["media_id": "foreign"]).validated(reportId: report))
    }
    func testKeepsPausedIntentWithdrawableWithoutClaimingSharing() throws {
        let value = try state(["portal_enabled": false], itemPatch: ["published": true, "evidence_id": attachment, "version": "2026-10-12T00:00:00.123456+00:00"]).validated(reportId: report)
        XCTAssertTrue(value.items[0].published); XCTAssertFalse(value.items[0].sharingEnabled)
    }
    func testRejectsImpossibleVisibilityState() throws {
        XCTAssertThrowsError(try state(itemPatch: ["sharing_enabled": true]).validated(reportId: report))
        XCTAssertThrowsError(try state(["portal_enabled": false], itemPatch: ["published": true, "sharing_enabled": true, "evidence_id": attachment, "version": "v"]).validated(reportId: report))
        XCTAssertThrowsError(try state(itemPatch: ["published": true]).validated(reportId: report))
    }
    func testFirstPublicationEncodesExplicitNullVersionAndNoSourceIdentity() throws {
        let action = try ReportPhotoPublication.Action(attachmentId: attachment, visible: true, expectedVersion: nil)
        let object = try JSONSerialization.jsonObject(with: JSONEncoder().encode(action)) as! [String: Any]
        XCTAssertTrue(object["expected_version"] is NSNull); XCTAssertEqual(Set(object.keys), ["attachment_id", "visible", "expected_version"])
    }
    func testPreservesOpaqueMicrosecondVersionForCAS() throws {
        let version = "2026-10-12T00:00:00.123456+00:00"
        let action = try ReportPhotoPublication.Action(attachmentId: attachment, visible: false, expectedVersion: version)
        let object = try JSONSerialization.jsonObject(with: JSONEncoder().encode(action)) as! [String: Any]
        XCTAssertEqual(object["expected_version"] as? String, version)
    }
    func testRejectsInjectedPathsBeforeNetworkRequest() {
        XCTAssertThrowsError(try ReportPhotoPublication.requestPath(reportId: "../other"))
        XCTAssertThrowsError(try ReportPhotoPublication.Action(attachmentId: "foreign", visible: true, expectedVersion: nil))
    }
}
