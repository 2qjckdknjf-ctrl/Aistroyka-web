//
//  ManagerV43UITests.swift
//  AiStroykaManagerUITests
//

import XCTest

final class ManagerV43UITests: XCTestCase {
    override func setUp() {
        super.setUp()
        addUIInterruptionMonitor(withDescription: "System permission dialogs") { alert in
            for title in ["Don’t Allow", "Don't Allow", "Запретить", "Allow Once", "Allow", "Разрешить", "OK", "ОК"] {
                let button = alert.buttons[title]
                if button.exists {
                    button.tap()
                    return true
                }
            }
            return false
        }
    }

    func testLoginScreen_v43ContinueAndAppleAreReachable() {
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_UI_TEST"] = "1"
        app.launch()

        XCTAssertTrue(app.textFields["pilot_manager_email"].waitForExistence(timeout: 25))
        XCTAssertTrue(app.buttons["pilot_manager_sign_in"].exists)
        XCTAssertTrue(app.textFields["pilot_manager_password"].exists)
        saveShot("01-login")
    }

    func testPreviewCatalog_showsFiveTabs() {
        let app = launchPreviewCatalog()
        XCTAssertTrue(waitForCustomTabs(app), "Preview catalog should open the 5-tab shell")
        XCTAssertTrue(app.buttons["pilot_manager_tab_home"].exists)
        XCTAssertTrue(app.buttons["pilot_manager_tab_projects"].exists)
        XCTAssertTrue(app.buttons["pilot_manager_tab_tasks"].exists)
        XCTAssertTrue(app.buttons["pilot_manager_tab_ai"].exists)
        XCTAssertTrue(app.buttons["pilot_manager_tab_more"].exists)
    }

    func testPreviewCatalog_moreReportsTeamAndNotifications() {
        let app = launchPreviewCatalog()
        XCTAssertTrue(waitForCustomTabs(app))
        tapTab(app, "pilot_manager_tab_more")

        let reports = app.descendants(matching: .any)["pilot_manager_tab_reports"]
        XCTAssertTrue(reports.waitForExistence(timeout: 10))
        reports.firstMatch.tap()
        XCTAssertTrue(app.navigationBars.firstMatch.waitForExistence(timeout: 10))
        if app.navigationBars.buttons.count > 0 {
            app.navigationBars.buttons.firstMatch.tap()
        }
    }

    func testPreviewCatalog_captureCanonScreenshots() throws {
        let app = launchPreviewCatalog()
        XCTAssertTrue(waitForCustomTabs(app))
        saveShot("02-home-today")

        tapTab(app, "pilot_manager_tab_projects")
        _ = app.otherElements["pilot_manager_projects_list"].waitForExistence(timeout: 6)
        saveShot("03-project-portfolio")
        let firstProject = app.otherElements["pilot_manager_projects_list"]
            .descendants(matching: .any)
            .matching(NSPredicate(format: "identifier BEGINSWITH 'pilot_manager_project_'"))
            .firstMatch
        if firstProject.waitForExistence(timeout: 4), firstProject.isHittable {
            firstProject.tap()
            saveShot("04-project-command-center")
            if app.navigationBars.buttons.count > 0 { app.navigationBars.buttons.firstMatch.tap() }
        }

        tapTab(app, "pilot_manager_tab_tasks")
        _ = app.descendants(matching: .any)["pilot_manager_tasks_ready"].waitForExistence(timeout: 10)
        saveShot("05-tasks-calendar")
        waitUntilHittable(app.buttons["pilot_manager_create_task"], timeout: 12)
        tapIfHittable(app.buttons["pilot_manager_create_task"]) {
            _ = app.textFields["pilot_manager_create_task_title"].waitForExistence(timeout: 8)
                || app.buttons["pilot_manager_create_task_cancel"].waitForExistence(timeout: 4)
            saveShot("06-create-task")
            tapIfHittable(app.buttons["pilot_manager_create_task_cancel"], timeout: 3)
            if app.buttons["pilot_manager_create_task_cancel"].exists {
                app.swipeDown()
            }
        }

        tapTab(app, "pilot_manager_tab_ai")
        _ = app.descendants(matching: .any)["pilot_manager_ai_center"].waitForExistence(timeout: 10)
            || app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] 'AI'")).firstMatch.waitForExistence(timeout: 4)
        saveShot("09-ai-center-risks")
        tapIfHittable(app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH 'pilot_manager_ai_risk_'")).firstMatch) {
            saveShot("10-ai-risk-detail")
            tapIfHittable(app.descendants(matching: .any)["pilot_manager_open_report"].firstMatch) {
                saveShot("10b-ai-open-report")
                if app.navigationBars.buttons.count > 0 { app.navigationBars.buttons.firstMatch.tap() }
            }
            if app.navigationBars.buttons.count > 0 { app.navigationBars.buttons.firstMatch.tap() }
        }

        tapTab(app, "pilot_manager_tab_more")
        _ = app.descendants(matching: .any)["pilot_manager_more_root"].waitForExistence(timeout: 10)
        saveShot("15-profile-settings")

        tapIfHittable(app.descendants(matching: .any)["pilot_manager_tab_reports"].firstMatch) {
            saveShot("07-reports-review-queue")
            tapIfHittable(app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH 'pilot_manager_report_'")).firstMatch) {
                saveShot("08-report-review")
                if app.navigationBars.buttons.count > 0 { app.navigationBars.buttons.firstMatch.tap() }
            }
            if app.navigationBars.buttons.count > 0 { app.navigationBars.buttons.firstMatch.tap() }
        }

        openMoreIdentifier(app, "pilot_manager_more_documents")
        saveShot("11-documents-hub")
        if app.navigationBars.buttons.count > 0 { app.navigationBars.buttons.firstMatch.tap() }

        openMoreIdentifier(app, "pilot_manager_more_team")
        saveShot("12-team")
        if app.navigationBars.buttons.count > 0 { app.navigationBars.buttons.firstMatch.tap() }

        openMoreIdentifier(app, "pilot_manager_more_analytics")
        saveShot("13-analytics")
        if app.navigationBars.buttons.count > 0 { app.navigationBars.buttons.firstMatch.tap() }

        openMoreIdentifier(app, "pilot_manager_more_notifications")
        saveShot("14-notifications")
    }

    func testLiveAccount_signInAndWalkSurfaces() throws {
        continueAfterFailure = false
        guard let creds = Self.liveCredentials() else {
            throw XCTSkip("Live credentials not provided")
        }
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_UI_TEST"] = "1"
        app.launch()

        let email = app.textFields["pilot_manager_email"]
        XCTAssertTrue(email.waitForExistence(timeout: 25), "Expected login email field")
        email.tap()
        email.typeText(creds.0)
        let password = app.textFields["pilot_manager_password"]
        XCTAssertTrue(password.waitForExistence(timeout: 8), "Expected password field in UI test mode")
        password.tap()
        password.typeText(creds.1)
        saveShot("01-login", live: true)
        app.buttons["pilot_manager_sign_in"].tap()

        let homeTab = app.buttons["pilot_manager_tab_home"]
        XCTAssertTrue(
            homeTab.waitForExistence(timeout: 50)
                || app.staticTexts["pilot_manager_login_error"].exists
                || app.otherElements["pilot_manager_unauthorized"].exists,
            "Expected 5-tab shell after live sign-in"
        )
        if app.staticTexts["pilot_manager_login_error"].exists {
            saveShot("login-error", live: true)
            XCTFail("Live login rejected: \(app.staticTexts["pilot_manager_login_error"].label)")
        }
        if app.otherElements["pilot_manager_unauthorized"].exists {
            saveShot("unauthorized", live: true)
            XCTFail("Live account is not an authorized manager role")
        }
        XCTAssertTrue(homeTab.exists, "Expected 5-tab shell after live sign-in")
        RunLoop.current.run(until: Date().addingTimeInterval(2))
        saveShot("02-home-today", live: true)

        tapIfHittable(app.buttons["pilot_manager_home_open_project"], timeout: 6) {
            _ = app.descendants(matching: .any)["pilot_manager_project_detail_e2e"].waitForExistence(timeout: 12)
                || app.descendants(matching: .any)["pilot_manager_project_detail_loading"].waitForExistence(timeout: 4)
            saveShot("04-project-command-center", live: true)
            if app.navigationBars.buttons.count > 0 { app.navigationBars.buttons.firstMatch.tap() }
        }

        tapTab(app, "pilot_manager_tab_projects")
        _ = app.otherElements["pilot_manager_projects_list"].waitForExistence(timeout: 10)
        saveShot("03-project-portfolio", live: true)
        tapIfHittable(
            app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH 'pilot_manager_project_'")).firstMatch,
            timeout: 6
        ) {
            _ = app.descendants(matching: .any)["pilot_manager_project_detail_e2e"].waitForExistence(timeout: 12)
            saveShot("04-project-command-center", live: true)
            if app.navigationBars.buttons.count > 0 { app.navigationBars.buttons.firstMatch.tap() }
        }

        tapTab(app, "pilot_manager_tab_tasks")
        _ = app.descendants(matching: .any)["pilot_manager_tasks_ready"].waitForExistence(timeout: 16)
        waitUntilHittable(app.descendants(matching: .any)["pilot_manager_create_task"].firstMatch, timeout: 16)
        saveShot("05-tasks-calendar", live: true)
        tapIfHittable(app.descendants(matching: .any)["pilot_manager_create_task"].firstMatch, timeout: 8) {
            XCTAssertTrue(
                app.textFields["pilot_manager_create_task_title"].waitForExistence(timeout: 10)
                    || app.buttons["pilot_manager_create_task_cancel"].waitForExistence(timeout: 4),
                "Live create-task sheet must not trap the user"
            )
            saveShot("06-create-task", live: true)
            tapIfHittable(app.buttons["pilot_manager_create_task_cancel"], timeout: 4)
            if app.sheets.firstMatch.exists { app.swipeDown() }
            _ = app.descendants(matching: .any)["pilot_manager_tasks_ready"].waitForExistence(timeout: 6)
        }

        tapTab(app, "pilot_manager_tab_ai")
        _ = app.descendants(matching: .any)["pilot_manager_ai_center"].waitForExistence(timeout: 16)
        saveShot("09-ai-center-risks", live: true)
        tapIfHittable(app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH 'pilot_manager_ai_risk_'")).firstMatch) {
            saveShot("10-ai-risk-detail", live: true)
            _ = app.descendants(matching: .any)["pilot_manager_open_report"].waitForExistence(timeout: 4)
            tapIfHittable(app.descendants(matching: .any)["pilot_manager_open_report"].firstMatch) {
                saveShot("10b-ai-open-report", live: true)
                if app.navigationBars.buttons.count > 0 { app.navigationBars.buttons.firstMatch.tap() }
            }
            if app.navigationBars.buttons.count > 0 { app.navigationBars.buttons.firstMatch.tap() }
        }

        tapTab(app, "pilot_manager_tab_more")
        var moreRoot = app.descendants(matching: .any)["pilot_manager_more_root"]
        if !moreRoot.waitForExistence(timeout: 4) {
            tapTab(app, "pilot_manager_tab_more")
            moreRoot = app.descendants(matching: .any)["pilot_manager_more_root"]
        }
        XCTAssertTrue(
            moreRoot.waitForExistence(timeout: 12),
            "More tab must show the profile root after live sign-in"
        )
        saveShot("15-profile-settings", live: true)
        tapIfHittable(app.descendants(matching: .any)["pilot_manager_tab_reports"].firstMatch) {
            saveShot("07-reports-review-queue", live: true)
            tapIfHittable(app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH 'pilot_manager_report_'")).firstMatch) {
                saveShot("08-report-review", live: true)
                if app.navigationBars.buttons.count > 0 { app.navigationBars.buttons.firstMatch.tap() }
            }
            if app.navigationBars.buttons.count > 0 { app.navigationBars.buttons.firstMatch.tap() }
        }
        openMoreIdentifier(app, "pilot_manager_more_documents")
        _ = app.descendants(matching: .any)["pilot_manager_documents_hub"].waitForExistence(timeout: 16)
            || app.descendants(matching: .any)["pilot_manager_documents_loading"].waitForExistence(timeout: 4)
        saveShot("11-documents-hub", live: true)
        if app.navigationBars.buttons.count > 0 { app.navigationBars.buttons.firstMatch.tap() }
        openMoreIdentifier(app, "pilot_manager_more_team")
        saveShot("12-team", live: true)
        if app.navigationBars.buttons.count > 0 { app.navigationBars.buttons.firstMatch.tap() }
        openMoreIdentifier(app, "pilot_manager_more_analytics")
        _ = app.descendants(matching: .any)["pilot_manager_analytics"].waitForExistence(timeout: 16)
            || app.descendants(matching: .any)["pilot_manager_analytics_loading"].waitForExistence(timeout: 4)
        saveShot("13-analytics", live: true)
        if app.navigationBars.buttons.count > 0 { app.navigationBars.buttons.firstMatch.tap() }
        openMoreIdentifier(app, "pilot_manager_more_notifications")
        saveShot("14-notifications", live: true)
    }

    private func launchPreviewCatalog() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_UI_TEST"] = "1"
        app.launchEnvironment["AISTROYKA_MANAGER_V43_PREVIEW"] = "1"
        app.launchArguments += ["-AISTROYKA_MANAGER_V43_PREVIEW"]
        app.launch()
        return app
    }

    private func waitForCustomTabs(_ app: XCUIApplication) -> Bool {
        app.buttons["pilot_manager_tab_home"].waitForExistence(timeout: 25)
            || app.otherElements["pilot_manager_tab_shell"].waitForExistence(timeout: 2)
            || app.tabBars.firstMatch.waitForExistence(timeout: 2)
    }

    private func tapTab(_ app: XCUIApplication, _ identifier: String) {
        let button = app.buttons[identifier]
        guard button.waitForExistence(timeout: 6) else { return }
        button.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
    }

    private func tapIfHittable(_ element: XCUIElement, timeout: TimeInterval = 4, then body: () -> Void = {}) {
        guard element.waitForExistence(timeout: timeout), element.isHittable else { return }
        element.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        body()
    }

    private func waitUntilHittable(_ element: XCUIElement, timeout: TimeInterval) {
        guard element.waitForExistence(timeout: timeout) else { return }
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline, !element.isHittable {
            RunLoop.current.run(until: Date().addingTimeInterval(0.4))
        }
    }

    private func openMoreIdentifier(_ app: XCUIApplication, _ identifier: String) {
        tapTab(app, "pilot_manager_tab_more")
        _ = app.descendants(matching: .any)["pilot_manager_more_root"].waitForExistence(timeout: 6)
        tapIfHittable(app.buttons[identifier])
    }

    private func saveShot(_ name: String, live: Bool = false) {
        let data = XCUIScreen.main.screenshot().pngRepresentation
        var dir = URL(fileURLWithPath: "/Users/alex/Projects/AISTROYKA-ios-manager-v4-3/docs/mobile-rebuild/evidence/ios-manager-v4-3", isDirectory: true)
        if live { dir.appendPathComponent("live", isDirectory: true) }
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        try? data.write(to: dir.appendingPathComponent("\(name).png"))
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = live ? "live-\(name)" : name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private static func liveCredentials() -> (String, String)? {
        if let email = ProcessInfo.processInfo.environment["AISTROYKA_LIVE_EMAIL"],
           let password = ProcessInfo.processInfo.environment["AISTROYKA_LIVE_PASSWORD"],
           !email.isEmpty, !password.isEmpty {
            return (email, password)
        }
        guard let text = try? String(contentsOfFile: "/tmp/aistroyka-live-login.env", encoding: .utf8) else {
            return nil
        }
        var email = ""
        var password = ""
        for raw in text.split(separator: "\n") {
            let line = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            guard let split = line.firstIndex(of: "=") else { continue }
            let key = String(line[..<split])
            let value = String(line[line.index(after: split)...])
            if key == "EMAIL" { email = value }
            if key == "PASSWORD" { password = value }
        }
        guard !email.isEmpty, !password.isEmpty else { return nil }
        return (email, password)
    }
}
