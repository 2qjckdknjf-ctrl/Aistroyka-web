import XCTest
@testable import Shared

final class CustomerPortalProjectViewTests: XCTestCase {
    func testDecodesCustomerFacingEstimatesAndRequests() throws {
        let data = Data("""
        {
          "project": {"id": "p1", "name": "Villa"},
          "progress": {"tasks_done": 2, "tasks_total": 5},
          "milestones": [],
          "documents": [],
          "decisions": [],
          "handover": {"status": "in_progress", "handover_notes": null, "handed_over_at": null, "completed_at": null},
          "customer_estimates": [{
            "id": "e1",
            "title": "Kitchen package",
            "description": null,
            "status": "sent",
            "total_amount": 12000.5,
            "currency": "EUR",
            "valid_until": "2026-11-01",
            "customer_note": null
          }],
          "client_requests": [{
            "id": "r1",
            "kind": "approve_or_reject",
            "action_mode": "action_required",
            "status": "open",
            "title": "Approve estimate",
            "instructions": "Please confirm",
            "customer_visible_amount": 12000.5,
            "customer_visible_currency": "EUR",
            "due_at": null
          }],
          "capabilities": {"can_respond_to_requests": true}
        }
        """.utf8)
        let view = try CustomerPortalProjectView.decodePortalJSON(data)
        XCTAssertEqual(view.project.id, "p1")
        XCTAssertEqual(view.customerEstimates.count, 1)
        XCTAssertEqual(view.customerEstimates[0].totalAmount, 12000.5, accuracy: 0.001)
        XCTAssertEqual(view.clientRequests[0].customerVisibleAmount, 12000.5)
        XCTAssertEqual(view.capabilities?.canRespondToRequests, true)
        XCTAssertTrue(view.canRespondApproveReject(to: view.clientRequests[0]))
        XCTAssertTrue(view.canRespondApproveReject(to: view.customerEstimates[0]))
        XCTAssertTrue(CustomerPortalProjectView.formatCustomerAmount(amount: 12000.5, currency: "EUR").contains("12"))
    }

    func testAcknowledgeGate() throws {
        let data = Data("""
        {
          "project": {"id": "p1", "name": "Villa"},
          "progress": {"tasks_done": 0, "tasks_total": 0},
          "client_requests": [
            {"id":"r1","kind":"acknowledge","action_mode":"action_required","status":"open","title":"Got it?"}
          ],
          "capabilities": {"can_respond_to_requests": true}
        }
        """.utf8)
        let view = try CustomerPortalProjectView.decodePortalJSON(data)
        XCTAssertTrue(view.canAcknowledge(to: view.clientRequests[0]))
    }

    func testFeedbackGate() throws {
        let data = Data("""
        {
          "project": {"id": "p1", "name": "Villa"},
          "progress": {"tasks_done": 0, "tasks_total": 0},
          "client_requests": [
            {"id":"r1","kind":"feedback","action_mode":"action_required","status":"open","title":"Thoughts?"},
            {"id":"r2","kind":"feedback","action_mode":"action_required","status":"responded","title":"Done"}
          ],
          "capabilities": {"can_respond_to_requests": true}
        }
        """.utf8)
        let view = try CustomerPortalProjectView.decodePortalJSON(data)
        XCTAssertTrue(view.canSubmitFeedback(to: view.clientRequests[0]))
        XCTAssertFalse(view.canSubmitFeedback(to: view.clientRequests[1]))
    }

    func testDocumentReviewConfirmGate() throws {
        let data = Data("""
        {
          "project": {"id": "p1", "name": "Villa"},
          "progress": {"tasks_done": 0, "tasks_total": 0},
          "client_requests": [
            {"id":"r1","kind":"document_review","action_mode":"action_required","status":"open","title":"Review plan"},
            {"id":"r2","kind":"document_review","action_mode":"info_only","status":"open","title":"FYI"},
            {"id":"r3","kind":"approve_or_reject","action_mode":"action_required","status":"open","title":"Approve"}
          ],
          "capabilities": {"can_respond_to_requests": true}
        }
        """.utf8)
        let view = try CustomerPortalProjectView.decodePortalJSON(data)
        XCTAssertTrue(view.canConfirmDocumentReview(to: view.clientRequests[0]))
        XCTAssertFalse(view.canConfirmDocumentReview(to: view.clientRequests[1]))
        XCTAssertFalse(view.canConfirmDocumentReview(to: view.clientRequests[2]))
        XCTAssertTrue(view.canRespondApproveReject(to: view.clientRequests[2]))
    }

    func testEstimateApproveRejectGateRequiresSentAndCapability() throws {
        let data = Data("""
        {
          "project": {"id": "p1", "name": "Villa"},
          "progress": {"tasks_done": 0, "tasks_total": 0},
          "customer_estimates": [
            {"id":"e1","title":"A","status":"sent","total_amount":1,"currency":"EUR"},
            {"id":"e2","title":"B","status":"draft","total_amount":1,"currency":"EUR"},
            {"id":"e3","title":"C","status":"approved","total_amount":1,"currency":"EUR"}
          ],
          "capabilities": {"can_respond_to_requests": true}
        }
        """.utf8)
        let view = try CustomerPortalProjectView.decodePortalJSON(data)
        XCTAssertTrue(view.canRespondApproveReject(to: view.customerEstimates[0]))
        XCTAssertFalse(view.canRespondApproveReject(to: view.customerEstimates[1]))
        XCTAssertFalse(view.canRespondApproveReject(to: view.customerEstimates[2]))
    }

    func testApproveRejectGateRespectsKindActionAndCapability() throws {
        let data = Data("""
        {
          "project": {"id": "p1", "name": "Villa"},
          "progress": {"tasks_done": 0, "tasks_total": 0},
          "client_requests": [
            {"id":"r1","kind":"approve_or_reject","action_mode":"action_required","status":"open","title":"A"},
            {"id":"r2","kind":"approve_or_reject","action_mode":"info_only","status":"open","title":"B"},
            {"id":"r3","kind":"feedback","action_mode":"action_required","status":"open","title":"C"},
            {"id":"r4","kind":"approve_or_reject","action_mode":"action_required","status":"responded","title":"D"}
          ],
          "capabilities": {"can_respond_to_requests": true}
        }
        """.utf8)
        let view = try CustomerPortalProjectView.decodePortalJSON(data)
        XCTAssertTrue(view.canRespondApproveReject(to: view.clientRequests[0]))
        XCTAssertFalse(view.canRespondApproveReject(to: view.clientRequests[1]))
        XCTAssertFalse(view.canRespondApproveReject(to: view.clientRequests[2]))
        XCTAssertFalse(view.canRespondApproveReject(to: view.clientRequests[3]))

        let viewOnly = Data("""
        {
          "project": {"id": "p1", "name": "Villa"},
          "progress": {"tasks_done": 0, "tasks_total": 0},
          "client_requests": [
            {"id":"r1","kind":"approve_or_reject","action_mode":"action_required","status":"open","title":"A"}
          ],
          "capabilities": {"can_respond_to_requests": false}
        }
        """.utf8)
        let blocked = try CustomerPortalProjectView.decodePortalJSON(viewOnly)
        XCTAssertFalse(blocked.canRespondApproveReject(to: blocked.clientRequests[0]))
    }

    func testMissingOptionalCollectionsDefaultEmpty() throws {
        let data = Data("""
        {"project":{"id":"p1","name":"Villa"},"progress":{"tasks_done":0,"tasks_total":0}}
        """.utf8)
        let view = try CustomerPortalProjectView.decodePortalJSON(data)
        XCTAssertTrue(view.customerEstimates.isEmpty)
        XCTAssertTrue(view.clientRequests.isEmpty)
        XCTAssertTrue(view.documents.isEmpty)
        XCTAssertNil(view.handover)
    }

    func testIgnoresContractorInternalFinanceAndActorFields() throws {
        let data = Data("""
        {
          "project": {"id": "p1", "name": "Villa"},
          "progress": {"tasks_done": 0, "tasks_total": 0},
          "customer_estimates": [{
            "id": "e1",
            "title": "Kitchen",
            "status": "sent",
            "total_amount": 1,
            "currency": "EUR",
            "margin": 999,
            "planned_amount": 50000,
            "actual_cost": 40000,
            "created_by": "contractor-user"
          }],
          "client_requests": [{
            "id": "r1",
            "kind": "feedback",
            "action_mode": "info_only",
            "status": "open",
            "title": "Note",
            "assigned_to": "foreman-id",
            "requested_by": "pm-id",
            "internal_cost": 888
          }]
        }
        """.utf8)
        let view = try CustomerPortalProjectView.decodePortalJSON(data)
        XCTAssertEqual(view.customerEstimates[0].totalAmount, 1)
        let estimateMirror = Mirror(reflecting: view.customerEstimates[0]).children.map { $0.label ?? "" }
        XCTAssertFalse(estimateMirror.contains("margin"))
        XCTAssertFalse(estimateMirror.contains("plannedAmount"))
        XCTAssertFalse(estimateMirror.contains("actualCost"))
        XCTAssertFalse(estimateMirror.contains("createdBy"))
        let requestMirror = Mirror(reflecting: view.clientRequests[0]).children.map { $0.label ?? "" }
        XCTAssertFalse(requestMirror.contains("assignedTo"))
        XCTAssertFalse(requestMirror.contains("requestedBy"))
        XCTAssertFalse(requestMirror.contains("internalCost"))
        XCTAssertNil(view.clientRequests[0].customerVisibleAmount)
    }
}
