import XCTest
@testable import Shared

final class ManagerV43FormattersTests: XCTestCase {
    func testPercentAndClamp() {
        XCTAssertEqual(ManagerV43Formatters.percentLabel(0.78), "78%")
        XCTAssertEqual(ManagerV43Formatters.clampedProgress(1.4), 1)
        XCTAssertEqual(ManagerV43Formatters.clampedProgress(-2), 0)
    }

    func testCurrencyAndDelay() {
        let ru = Locale(identifier: "ru_RU")
        let text = ManagerV43Formatters.compactCurrency(562_400_000, currencyCode: "RUB", locale: ru)
        XCTAssertTrue(text.contains("₽"))
        XCTAssertEqual(ManagerV43Formatters.delayLabel(days: 0, locale: ru), "По плану")
        XCTAssertTrue(ManagerV43Formatters.delayLabel(days: 8, locale: ru).contains("8"))
    }

    func testRiskAuditLineContainsActorDecisionAndSource() {
        let line = ManagerV43Formatters.riskDecisionAuditLine(
            actor: "manager",
            decision: "accept",
            comment: "ok",
            source: "ios-manager-v4.3",
            at: Date(timeIntervalSince1970: 1_700_000_000)
        )
        XCTAssertTrue(line.contains("actor=manager"))
        XCTAssertTrue(line.contains("decision=accept"))
        XCTAssertTrue(line.contains("source=ios-manager-v4.3"))
        XCTAssertTrue(line.contains("comment=ok"))
    }

    func testTaskPriorityOverdueIsHigh() {
        XCTAssertEqual(
            ManagerV43Formatters.taskPriority(from: "pending", dueDate: "2000-01-01", now: Date()),
            "high"
        )
        XCTAssertEqual(ManagerV43Formatters.taskPriority(from: "done", dueDate: "2000-01-01"), "low")
        XCTAssertEqual(
            ManagerV43Formatters.taskPriority(from: "pending", dueDate: "2000-01-01", stored: "low", now: Date()),
            "low"
        )
        XCTAssertEqual(
            ManagerV43Formatters.taskPriority(from: "pending", dueDate: nil, stored: "HIGH"),
            "high"
        )
        XCTAssertTrue(ManagerV43Formatters.isTaskOverdue(status: "pending", dueDate: "2000-01-01"))
        XCTAssertFalse(ManagerV43Formatters.isTaskOverdue(status: "done", dueDate: "2000-01-01"))
        XCTAssertFalse(ManagerV43Formatters.isTaskOverdue(status: "pending", dueDate: nil))
    }

    func testReportQueueAndAIRemarks() {
        XCTAssertEqual(ManagerV43Formatters.reportQueueBucket(from: "submitted"), "review")
        XCTAssertEqual(ManagerV43Formatters.reportQueueBucket(from: "approved"), "approved")
        XCTAssertEqual(ManagerV43Formatters.reportQueueBucket(from: "rejected"), "returned")
        XCTAssertEqual(ManagerV43Formatters.reportQueueBucket(from: "draft"), "draft")
        XCTAssertEqual(ManagerV43Formatters.reportQueueBucket(from: nil), "other")
        XCTAssertEqual(ManagerV43Formatters.reportQueueBucket(from: "unknown"), "other")
        XCTAssertTrue(ManagerV43Formatters.isReportPendingReview("submitted"))
        XCTAssertTrue(ManagerV43Formatters.isReportPendingReview("pending_review"))
        XCTAssertFalse(ManagerV43Formatters.isReportPendingReview("draft"))
        XCTAssertFalse(ManagerV43Formatters.isReportPendingReview("approved"))
        XCTAssertFalse(ManagerV43Formatters.isReportPendingReview(nil))
        XCTAssertTrue(ManagerV43Formatters.reportHasAIRemarks(analysisStatus: "flagged_deviation"))
        XCTAssertFalse(ManagerV43Formatters.reportHasAIRemarks(analysisStatus: "ok"))
    }

    func testWorkerPresenceAndNotificationAction() {
        XCTAssertEqual(
            ManagerV43Formatters.workerPresence(openShift: true, noActivity: false, lastStartedAt: nil, lastEndedAt: nil),
            "on_site"
        )
        XCTAssertEqual(
            ManagerV43Formatters.workerPresence(openShift: false, noActivity: true, lastStartedAt: nil, lastEndedAt: nil),
            "offline"
        )
        XCTAssertTrue(ManagerV43Formatters.notificationNeedsAction(type: "risk", readAt: nil))
        XCTAssertFalse(ManagerV43Formatters.notificationNeedsAction(type: "risk", readAt: "2026-08-25T10:00:00Z"))
        XCTAssertTrue(ManagerV43Formatters.isPermissionDenied("403 Forbidden"))
        XCTAssertEqual(ManagerV43Formatters.dayGroup(createdAt: ISO8601DateFormatter().string(from: Date())), "today")
        XCTAssertEqual(ManagerV43Formatters.shortIdentifier("abcdefghijkl"), "abcdefgh…")
    }

    func testDetectImageKindFromMagicBytes() {
        let png = Data([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
        XCTAssertEqual(MediaUploadHelper.detectImageKind(data: png).mimeType, "image/png")
        XCTAssertEqual(MediaUploadHelper.detectImageKind(data: png).fileExtension, "png")

        let jpeg = Data([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10])
        XCTAssertEqual(MediaUploadHelper.detectImageKind(data: jpeg).mimeType, "image/jpeg")
        XCTAssertEqual(MediaUploadHelper.detectImageKind(data: jpeg).fileExtension, "jpg")

        var heic = Data([0x00, 0x00, 0x00, 0x18])
        heic.append(contentsOf: [0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63])
        XCTAssertEqual(MediaUploadHelper.detectImageKind(data: heic).mimeType, "image/heic")

        XCTAssertEqual(MediaUploadHelper.detectImageKind(data: Data([0x00, 0x01])).mimeType, "image/jpeg")
    }
}
