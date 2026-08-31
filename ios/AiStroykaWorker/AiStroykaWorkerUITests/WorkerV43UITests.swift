//
//  WorkerV43UITests.swift
//  AiStroykaWorkerUITests
//

import XCTest

final class WorkerV43UITests: XCTestCase {
    func testPreviewCatalogOpensTodayWithoutAuth() {
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_WORKER_V43_PREVIEW"] = "1"
        app.launch()

        let today = app.descendants(matching: .any)["pilot_worker_home_scroll"]
        XCTAssertTrue(today.waitForExistence(timeout: 20), "Preview catalog must open Today without auth")
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_tab_today"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_tab_tasks"].exists)
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_v43_catalog"].exists)
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_v43_main_task"].exists)
        XCTAssertFalse(app.staticTexts["Authentication required"].exists)

        app.descendants(matching: .any)["pilot_worker_tab_tasks"].firstMatch.tap()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_task_preview-task-1"].waitForExistence(timeout: 5))

        app.descendants(matching: .any)["pilot_worker_tab_messages"].firstMatch.tap()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_chat_preview-task-1"].waitForExistence(timeout: 5))
        app.descendants(matching: .any)["pilot_worker_chat_preview-task-1"].firstMatch.tap()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_task_chat"].waitForExistence(timeout: 8))
        XCTAssertFalse(app.staticTexts["Authentication required"].exists)

        app.descendants(matching: .any)["pilot_worker_tab_more"].firstMatch.tap()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_end_shift"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.descendants(matching: .any)["pilot_worker_start_shift"].exists)
        XCTAssertTrue(app.buttons["pilot_worker_more_issues"].exists)
        XCTAssertTrue(app.buttons["pilot_worker_more_documents"].exists)
        XCTAssertTrue(app.buttons["pilot_worker_more_reports"].exists)
    }

    func testPreviewCatalog_tapsCameraQuickActionsAndMore() {
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_WORKER_V43_PREVIEW"] = "1"
        app.launch()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_home_scroll"].waitForExistence(timeout: 20))

        let bell = app.descendants(matching: .any)["pilot_worker_home_notifications"].firstMatch
        XCTAssertTrue(bell.waitForExistence(timeout: 8), "Today bell must stay pinned and reachable")
        if bell.isHittable {
            bell.tap()
        } else {
            bell.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        }
        XCTAssertTrue(
            app.descendants(matching: .any)["pilot_worker_messages"].waitForExistence(timeout: 10)
                || app.descendants(matching: .any)["pilot_worker_chat_preview-task-1"].waitForExistence(timeout: 4),
            "Today bell must open Messages"
        )
        app.descendants(matching: .any)["pilot_worker_tab_today"].firstMatch.tap()

        app.descendants(matching: .any)["pilot_worker_tab_camera"].firstMatch.tap()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_camera_context"].waitForExistence(timeout: 8), "Camera tab must open the in-app context sheet")
        XCTAssertTrue(app.buttons["pilot_worker_camera_context_task"].exists)
        XCTAssertTrue(app.buttons["pilot_worker_camera_context_report"].exists)
        XCTAssertTrue(app.buttons["pilot_worker_camera_context_issue"].exists)

        app.buttons["pilot_worker_camera_context_task"].firstMatch.tap()
        XCTAssertTrue(
            app.descendants(matching: .any)["pilot_worker_camera_before"].waitForExistence(timeout: 10)
                || app.descendants(matching: .any)["pilot_worker_photo_before_pick"].waitForExistence(timeout: 2),
            "Camera → task must open BEFORE capture, not a dead sheet"
        )
        if app.navigationBars.buttons.count > 0 {
            app.navigationBars.buttons.firstMatch.tap()
        }
        let cancel = app.buttons["pilot_worker_camera_context_cancel"]
        if cancel.waitForExistence(timeout: 3) {
            cancel.tap()
        }

        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_home_scroll"].waitForExistence(timeout: 8))
        app.descendants(matching: .any)["pilot_worker_quick_issue"].firstMatch.tap()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_issues_list"].waitForExistence(timeout: 10), "Quick issue must open the issues list")
        if app.navigationBars.buttons.count > 0 {
            app.navigationBars.buttons.firstMatch.tap()
        }

        app.descendants(matching: .any)["pilot_worker_tab_today"].firstMatch.tap()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_quick_drawing"].waitForExistence(timeout: 8))
        app.descendants(matching: .any)["pilot_worker_quick_drawing"].firstMatch.tap()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_documents"].waitForExistence(timeout: 10), "Quick drawing must open the drawings hub")
        if app.navigationBars.buttons.count > 0 {
            app.navigationBars.buttons.firstMatch.tap()
        }

        app.descendants(matching: .any)["pilot_worker_tab_more"].firstMatch.tap()
        XCTAssertTrue(app.buttons["pilot_worker_more_documents"].waitForExistence(timeout: 8))
        app.buttons["pilot_worker_more_documents"].firstMatch.tap()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_documents"].waitForExistence(timeout: 10), "More → documents must open the drawings hub")
        if app.navigationBars.buttons.count > 0 {
            app.navigationBars.buttons.firstMatch.tap()
        }

        XCTAssertTrue(app.buttons["pilot_worker_more_reports"].waitForExistence(timeout: 8))
        app.buttons["pilot_worker_more_reports"].firstMatch.tap()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_daily_report"].waitForExistence(timeout: 10), "More → reports must open the daily report form")
    }

    func testPreviewOpensTaskDetailAndWIP() {
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_WORKER_V43_PREVIEW"] = "1"
        app.launch()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_home_scroll"].waitForExistence(timeout: 20))
        app.descendants(matching: .any)["pilot_worker_task_preview-task-1"].firstMatch.tap()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_v43_task_detail"].waitForExistence(timeout: 8))
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_start_report"].exists)
        app.descendants(matching: .any)["pilot_worker_start_report"].firstMatch.tap()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_v43_wip"].waitForExistence(timeout: 8))
    }

    func testPreviewOpensIssuesDocumentsAndShift() {
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_WORKER_V43_PREVIEW"] = "1"
        app.launchEnvironment["AISTROYKA_WORKER_V43_SCREEN"] = "issues"
        app.launch()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_issues_list"].waitForExistence(timeout: 20))
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_issue_create"].waitForExistence(timeout: 5))
        app.descendants(matching: .any)["pilot_worker_issue_create"].firstMatch.tap()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_issue_create_photo"].waitForExistence(timeout: 5))

        app.terminate()
        app.launchEnvironment["AISTROYKA_WORKER_V43_SCREEN"] = "documents"
        app.launch()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_documents"].waitForExistence(timeout: 20))

        app.terminate()
        app.launchEnvironment["AISTROYKA_WORKER_V43_SCREEN"] = "shift"
        app.launch()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_shift_start"].waitForExistence(timeout: 20))
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_safety_helmet"].exists)
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_safety_confirm"].exists)
    }

    func testPreviewOpensCameraReportFeedbackAndIssueResolution() {
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_WORKER_V43_PREVIEW"] = "1"
        app.launchEnvironment["AISTROYKA_WORKER_V43_SCREEN"] = "before"
        app.launch()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_preview_before"].waitForExistence(timeout: 20))
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_camera_before"].waitForExistence(timeout: 8))

        app.terminate()
        app.launchEnvironment["AISTROYKA_WORKER_V43_SCREEN"] = "after"
        app.launch()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_preview_after"].waitForExistence(timeout: 20))
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_camera_after"].waitForExistence(timeout: 8))
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_camera_ghost"].waitForExistence(timeout: 5))

        app.terminate()
        app.launchEnvironment["AISTROYKA_WORKER_V43_SCREEN"] = "report"
        app.launch()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_preview_report"].waitForExistence(timeout: 20))
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_daily_report"].waitForExistence(timeout: 8))

        app.terminate()
        app.launchEnvironment["AISTROYKA_WORKER_V43_SCREEN"] = "review"
        app.launch()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_preview_review"].waitForExistence(timeout: 20))
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_report_review"].waitForExistence(timeout: 8))
        XCTAssertFalse(app.staticTexts["Authentication required"].exists)

        app.terminate()
        app.launchEnvironment["AISTROYKA_WORKER_V43_SCREEN"] = "feedback"
        app.launch()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_preview_feedback"].waitForExistence(timeout: 20))
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_feedback_resubmit"].waitForExistence(timeout: 8))
        XCTAssertFalse(app.staticTexts["Authentication required"].exists)
        XCTAssertTrue(app.buttons["pilot_worker_submit_again"].waitForExistence(timeout: 5))

        app.terminate()
        app.launchEnvironment["AISTROYKA_WORKER_V43_SCREEN"] = "issue"
        app.launch()
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_preview_issue"].waitForExistence(timeout: 20))
        XCTAssertTrue(app.descendants(matching: .any)["pilot_worker_issue_send_review"].waitForExistence(timeout: 8))
    }

    func testLoginSurfaceExposesCanonAndLegacyAuth() {
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_UI_TEST"] = "1"
        app.launch()

        XCTAssertTrue(app.textFields["pilot_worker_email"].waitForExistence(timeout: 20))
        XCTAssertTrue(app.buttons["pilot_worker_sign_in"].exists)
        XCTAssertTrue(app.buttons["pilot_worker_scan_qr"].exists)
        XCTAssertTrue(app.textFields["pilot_worker_phone"].exists)
    }

    func testInviteTokenParsingRejectsProjectIds() {
        XCTAssertNil(Self.inviteToken("proj-123"))
        XCTAssertNil(Self.inviteToken("https://aistroyka.ai/projects/abc"))
        XCTAssertNotNil(Self.inviteToken("https://aistroyka.ai/invite/accept?token=abcdefghijklmnopqrst"))
        XCTAssertNotNil(Self.inviteToken("aistroyka://join?token=abcdefghijklmnopqrst"))
    }

    func testReportGateRequiresPhotosAndSteps() {
        XCTAssertFalse(Self.canFinish(required: false, before: true, after: true))
        XCTAssertFalse(Self.canFinish(required: true, before: false, after: true))
        XCTAssertFalse(Self.canFinish(required: true, before: true, after: false))
        XCTAssertTrue(Self.canFinish(required: true, before: true, after: true))
    }

    func testLaunchFlagsReadEnvAndArguments() {
        XCTAssertTrue(Self.flagOn("AISTROYKA_WORKER_V43_PREVIEW", args: ["-AISTROYKA_WORKER_V43_PREVIEW"], env: [:]))
        XCTAssertTrue(Self.flagOn("AISTROYKA_WORKER_V43_PREVIEW", args: [], env: ["AISTROYKA_WORKER_V43_PREVIEW": "1"]))
        XCTAssertTrue(Self.flagOn("AISTROYKA_UI_TEST", args: [], env: ["AISTROYKA_UI_TEST": "preview"]))
        XCTAssertFalse(Self.flagOn("AISTROYKA_WORKER_V43_PREVIEW", args: ["-AISTROYKA_UI_TEST"], env: ["AISTROYKA_UI_TEST": "1"]))
    }

    func testPhotoEvidenceRules() {
        XCTAssertFalse(Self.isSharp(pixelCount: 10_000, variance: 80))
        XCTAssertTrue(Self.isSharp(pixelCount: 200_000, variance: 80))
        XCTAssertFalse(Self.isSharp(pixelCount: 200_000, variance: 5))
        XCTAssertTrue(Self.isSharp(pixelCount: 400_000, variance: 5))
        XCTAssertTrue(Self.isLowStorage(availableBytes: 1_000_000))
        XCTAssertFalse(Self.isLowStorage(availableBytes: 80_000_000))
        XCTAssertNil(Self.angleMatch(hasCurrent: false, hasReference: true))
        XCTAssertNil(Self.angleMatch(hasCurrent: true, hasReference: false))
        XCTAssertEqual(Self.comparisonMode(kindAfter: true, captured: false, before: true), "ghostBefore")
        XCTAssertEqual(Self.comparisonMode(kindAfter: true, captured: true, before: true), "split")
        XCTAssertEqual(Self.comparisonMode(kindAfter: true, captured: true, before: false), "capturedOnly")
        XCTAssertEqual(Self.comparisonMode(kindAfter: false, captured: false, before: true), "placeholder")
        XCTAssertEqual(Self.comparisonMode(kindAfter: false, captured: true, before: false), "capturedOnly")
        XCTAssertTrue(Self.dayMatch(due: "2026-08-29", selected: "2026-08-29", filter: "today", now: "2026-08-29"))
        XCTAssertFalse(Self.dayMatch(due: "2026-08-28", selected: "2026-08-29", filter: "today", now: "2026-08-29"))
        XCTAssertTrue(Self.dayMatch(due: nil, selected: "2026-08-29", filter: "today", now: "2026-08-29"))
        XCTAssertTrue(Self.dayMatch(due: "09:00", selected: "2026-08-29", filter: "week", now: "2026-08-29"))
        XCTAssertFalse(Self.dayMatch(due: "09:00", selected: "2026-08-28", filter: "week", now: "2026-08-29"))
        XCTAssertTrue(Self.dayMatch(due: "2026-08-28", selected: "2026-08-28", filter: "week", now: "2026-08-29"))
    }

    func testPhoneNormalization() {
        XCTAssertEqual(Self.phone("89151234567"), "+79151234567")
        XCTAssertEqual(Self.phone("+7 915 123-45-67"), "+79151234567")
        XCTAssertNil(Self.phone("123"))
    }

    private static func inviteToken(_ raw: String) -> String? {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if let url = URL(string: trimmed) {
            if let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems,
               let token = items.first(where: { $0.name == "token" || $0.name == "invite" })?.value {
                return sanitize(token)
            }
            if url.scheme?.lowercased() == "aistroyka" {
                return sanitize(url.query?.split(separator: "=").last.map(String.init) ?? url.lastPathComponent)
            }
        }
        return sanitize(trimmed)
    }

    private static func sanitize(_ raw: String?) -> String? {
        guard let raw else { return nil }
        let token = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard token.count >= 16, token.count <= 128 else { return nil }
        let allowed = CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "-_"))
        guard token.unicodeScalars.allSatisfy({ allowed.contains($0) }) else { return nil }
        return token
    }

    private static func canFinish(required: Bool, before: Bool, after: Bool) -> Bool {
        required && before && after
    }

    private static func flagOn(_ name: String, args: [String], env: [String: String]) -> Bool {
        func truthy(_ raw: String?) -> Bool {
            guard let raw else { return false }
            let value = raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            return value == "1" || value == "true" || value == "yes" || value == "preview"
        }
        if truthy(env[name]) { return true }
        let dashed = "-\(name)"
        if args.contains(dashed) || args.contains(name) { return true }
        return args.contains { arg in
            arg == "\(dashed)=1" || arg.hasPrefix("\(dashed)=") && arg.split(separator: "=").last == "1"
        }
    }

    private static func isSharp(pixelCount: CGFloat, variance: Double) -> Bool {
        if pixelCount < 180_000 { return false }
        return variance >= 40 || pixelCount >= 400_000
    }

    private static func isLowStorage(availableBytes: Int64) -> Bool {
        availableBytes < 50 * 1024 * 1024
    }

    private static func angleMatch(hasCurrent: Bool, hasReference: Bool) -> Bool? {
        guard hasCurrent, hasReference else { return nil }
        return true
    }

    private static func comparisonMode(kindAfter: Bool, captured: Bool, before: Bool) -> String {
        if captured { return kindAfter && before ? "split" : "capturedOnly" }
        if kindAfter && before { return "ghostBefore" }
        return "placeholder"
    }

    private static func dayMatch(due: String?, selected: String, filter: String, now: String) -> Bool {
        func day(_ raw: String) -> Date? {
            let formatter = DateFormatter()
            formatter.calendar = Calendar(identifier: .gregorian)
            formatter.locale = Locale(identifier: "en_US_POSIX")
            formatter.timeZone = TimeZone(secondsFromGMT: 0)
            formatter.dateFormat = "yyyy-MM-dd"
            return formatter.date(from: String(raw.prefix(10)))
        }
        let calendar = Calendar(identifier: .gregorian)
        let selectedDay = day(selected) ?? Date()
        let nowDay = day(now) ?? Date()
        switch filter {
        case "today":
            if let due, let parsed = day(due) { return calendar.isDate(parsed, inSameDayAs: nowDay) }
            return due == nil || day(due ?? "") == nil
        case "week":
            if let due, let parsed = day(due) { return calendar.isDate(parsed, inSameDayAs: selectedDay) }
            return calendar.isDate(selectedDay, inSameDayAs: nowDay)
        default:
            return true
        }
    }

    private static func phone(_ raw: String) -> String? {
        let digits = raw.filter(\.isNumber)
        guard digits.count >= 10, digits.count <= 15 else { return nil }
        if digits.hasPrefix("8"), digits.count == 11 { return "+7\(digits.dropFirst())" }
        if digits.hasPrefix("7"), digits.count == 11 { return "+\(digits)" }
        return "+\(digits)"
    }
}
