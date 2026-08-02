//
//  ManagerPhase5UITests.swift
//  AiStroykaManagerUITests
//
//  Phase 5 Layer B: exact-report review (changes_requested → approve). No Copilot/LLM send.
//

import XCTest

final class ManagerPhase5UITests: XCTestCase {
    private func requireConfigured() {
        if ProcessInfo.processInfo.environment["IOS_PHASE5_NO_SKIP"] == "1" {
            XCTAssertTrue(
                PilotE2ECredentials.isConfigured,
                "Phase 5 requires IOS_E2E_MANAGER_EMAIL/PASSWORD"
            )
            XCTAssertNotNil(PilotE2ECredentials.reportId, "IOS_E2E_REPORT_ID required")
        }
    }

    private func launchManager(email: String, password: String) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_E2E"] = "1"
        app.launchArguments += ["-AISTROYKA_E2E", "1"]
        app.launchEnvironment["AISTROYKA_E2E_EMAIL"] = email
        app.launchEnvironment["AISTROYKA_E2E_PASSWORD"] = password
        app.launchArguments += ["-AISTROYKA_E2E_EMAIL", email, "-AISTROYKA_E2E_PASSWORD", password]
        if let projectId = PilotE2ECredentials.projectId {
            app.launchEnvironment["AISTROYKA_E2E_PROJECT_ID"] = projectId
            app.launchEnvironment["IOS_E2E_PROJECT_ID"] = projectId
            app.launchArguments += ["-AISTROYKA_E2E_PROJECT_ID", projectId]
        }
        if let reportId = PilotE2ECredentials.reportId {
            app.launchEnvironment["AISTROYKA_E2E_REPORT_ID"] = reportId
            app.launchEnvironment["IOS_E2E_REPORT_ID"] = reportId
            app.launchArguments += ["-AISTROYKA_E2E_REPORT_ID", reportId]
        }
        if let base = PilotE2ECredentials.apiBaseURL {
            app.launchEnvironment["BASE_URL"] = base
            app.launchEnvironment["AISTROYKA_E2E_BASE_URL"] = base
            app.launchEnvironment["IOS_E2E_BASE_URL"] = base
            app.launchArguments += ["-AISTROYKA_E2E_BASE_URL", base, "-BASE_URL", base]
        }
        if let supa = PilotE2ECredentials.supabaseURL {
            app.launchEnvironment["SUPABASE_URL"] = supa
            app.launchArguments += ["-SUPABASE_URL", supa]
        }
        if let key = PilotE2ECredentials.supabaseAnonKey {
            app.launchEnvironment["SUPABASE_ANON_KEY"] = key
            app.launchArguments += ["-SUPABASE_ANON_KEY", key]
        }
        let credFile = PilotE2ECredentials.credentialsFilePath
        app.launchEnvironment["AISTROYKA_E2E_CRED_FILE"] = credFile
        app.launchArguments += ["-AISTROYKA_E2E_CRED_FILE", credFile]
        app.launch()
        return app
    }

    private func waitBootstrap(_ app: XCUIApplication, timeout: TimeInterval = 90) {
        let boot = app.otherElements["pilot_manager_e2e_bootstrapping"]
        guard boot.waitForExistence(timeout: 5) else { return }
        let deadline = Date().addingTimeInterval(timeout)
        while boot.exists, Date() < deadline {
            RunLoop.current.run(until: Date().addingTimeInterval(0.4))
        }
    }

    private func openReportsTab(_ app: XCUIApplication) {
        let byId = app.tabBars.buttons["pilot_manager_tab_reports"]
        if byId.waitForExistence(timeout: 5) {
            byId.tap()
            return
        }
        // SwiftUI tabItem identifiers are unreliable; match visible tab labels (en/ru).
        for label in ["Reports", "Отчёты", "Отчеты"] {
            let btn = app.tabBars.buttons[label]
            if btn.exists {
                btn.tap()
                return
            }
        }
        if app.tabBars.buttons.count > 3 {
            app.tabBars.buttons.element(boundBy: 3).tap()
        }
    }

    private func openExactReport(_ app: XCUIApplication) {
        guard let reportId = PilotE2ECredentials.reportId else {
            XCTFail("Missing report id")
            return
        }
        XCTAssertTrue(
            app.descendants(matching: .any)["pilot_manager_e2e_reports_shell"].waitForExistence(timeout: 60)
                || app.descendants(matching: .any)["pilot_manager_tab_shell"].waitForExistence(timeout: 30),
            "Manager reports tab shell required (not project-only deeplink)"
        )
        openReportsTab(app)
        let id = "pilot_manager_report_\(reportId)"
        let row = app.descendants(matching: .any)[id]
        let deadline = Date().addingTimeInterval(120)
        while Date() < deadline {
            if row.exists {
                if row.isHittable {
                    row.tap()
                    return
                }
                // NavigationLink cells can be hittable via first matching button/cell.
                let cell = app.cells.containing(.any, identifier: id).firstMatch
                if cell.exists, cell.isHittable {
                    cell.tap()
                    return
                }
                row.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
                return
            }
            app.swipeUp()
            RunLoop.current.run(until: Date().addingTimeInterval(0.5))
        }
        XCTAssertTrue(row.waitForExistence(timeout: 5), "Exact report row \(id) must exist — not a random inbox item")
        row.tap()
    }

    private func clearAndType(_ field: XCUIElement, text: String) {
        field.tap()
        if let value = field.value as? String, !value.isEmpty {
            let delete = String(repeating: XCUIKeyboardKey.delete.rawValue, count: value.count + 4)
            field.typeText(delete)
        }
        field.typeText(text)
    }

    func testManager_phase5_requestChangesOnExactReport() throws {
        if ProcessInfo.processInfo.environment["IOS_PHASE5_NO_SKIP"] != "1" {
            try PilotE2ECredentials.skipUnlessConfigured(self)
        } else {
            requireConfigured()
        }
        guard let email = PilotE2ECredentials.email, let password = PilotE2ECredentials.password else {
            XCTFail("Missing manager credentials")
            return
        }
        XCTAssertNotNil(PilotE2ECredentials.reportId)

        let app = launchManager(email: email, password: password)
        waitBootstrap(app)
        openExactReport(app)

        XCTAssertTrue(
            app.descendants(matching: .any)["pilot_manager_report_detail"].waitForExistence(timeout: 60)
                || app.buttons["pilot_manager_review_request_changes"].waitForExistence(timeout: 30),
            "Report detail / review actions"
        )

        let note = app.textFields["pilot_manager_review_note"].firstMatch
        let noteArea = app.textViews["pilot_manager_review_note"].firstMatch
        let managerNote = PilotE2ECredentials.managerNote ?? "PHASE5 please revise evidence"
        if note.waitForExistence(timeout: 10) {
            clearAndType(note, text: managerNote)
        } else if noteArea.waitForExistence(timeout: 5) {
            clearAndType(noteArea, text: managerNote)
        } else {
            XCTFail("Manager review note field missing")
        }

        let request = app.buttons["pilot_manager_review_request_changes"].firstMatch
        XCTAssertTrue(request.waitForExistence(timeout: 15))
        request.tap()

        let statusNode = app.descendants(matching: .any)["pilot_manager_report_status_changes_requested"]
        let deadline = Date().addingTimeInterval(90)
        var sawStatus = false
        while Date() < deadline {
            if statusNode.exists || app.staticTexts["changes_requested"].exists {
                sawStatus = true
                break
            }
            if app.descendants(matching: .any)["pilot_manager_review_error"].exists {
                XCTFail("Review error: \(app.descendants(matching: .any)["pilot_manager_review_error"].label)")
                return
            }
            // Review actions collapse after success; absence of the button + manager note is secondary proof.
            if !request.exists, app.descendants(matching: .any)["pilot_manager_report_manager_note"].exists {
                sawStatus = true
                break
            }
            RunLoop.current.run(until: Date().addingTimeInterval(0.5))
        }
        XCTAssertTrue(sawStatus, "Status must become changes_requested")
    }

    func testManager_phase5_approveExactReport() throws {
        if ProcessInfo.processInfo.environment["IOS_PHASE5_NO_SKIP"] != "1" {
            try PilotE2ECredentials.skipUnlessConfigured(self)
        } else {
            requireConfigured()
        }
        guard let email = PilotE2ECredentials.email, let password = PilotE2ECredentials.password else {
            XCTFail("Missing manager credentials")
            return
        }
        XCTAssertNotNil(PilotE2ECredentials.reportId)

        let app = launchManager(email: email, password: password)
        waitBootstrap(app)
        openExactReport(app)

        XCTAssertTrue(
            app.descendants(matching: .any)["pilot_manager_report_status_submitted"].waitForExistence(timeout: 60)
                || app.staticTexts["submitted"].waitForExistence(timeout: 5),
            "Resubmitted report must show submitted before approve"
        )

        let approve = app.buttons["pilot_manager_review_approve"].firstMatch
        let approveDeadline = Date().addingTimeInterval(90)
        while Date() < approveDeadline, !approve.exists {
            app.swipeUp()
            RunLoop.current.run(until: Date().addingTimeInterval(0.4))
        }
        XCTAssertTrue(approve.waitForExistence(timeout: 5), "Approve after worker resubmit")
        approve.tap()

        let approved = app.descendants(matching: .any)["pilot_manager_report_status_approved"]
        let approvedDeadline = Date().addingTimeInterval(90)
        var sawApproved = false
        while Date() < approvedDeadline {
            if approved.exists || app.staticTexts["approved"].exists {
                sawApproved = true
                break
            }
            RunLoop.current.run(until: Date().addingTimeInterval(0.5))
        }
        XCTAssertTrue(sawApproved, "Status must become approved")
    }
}
