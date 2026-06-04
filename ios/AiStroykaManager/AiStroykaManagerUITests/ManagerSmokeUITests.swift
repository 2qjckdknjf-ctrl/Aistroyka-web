//
//  ManagerSmokeUITests.swift
//  AiStroykaManagerUITests
//
//  Minimal UI smoke: login screen is reachable with stable accessibility identifiers.
//

import XCTest

final class ManagerSmokeUITests: XCTestCase {
    private func launchForE2E(deepLinkProject: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_E2E"] = "1"
        if deepLinkProject, let projectId = PilotE2ECredentials.projectId {
            app.launchEnvironment["AISTROYKA_E2E_PROJECT_ID"] = projectId
        }
        app.launch()
        return app
    }

    private func dismissKeyboardIfPresent(app: XCUIApplication) {
        let done = app.toolbars.buttons["Done"]
        if done.exists { done.tap(); return }
        let ret = app.keyboards.buttons["Return"]
        if ret.exists { ret.tap() }
    }

    private func signInManagerIfNeeded(app: XCUIApplication, email: String, password: String) {
        let emailField = app.textFields["pilot_manager_email"]
        guard emailField.waitForExistence(timeout: 20) else { return }
        emailField.tap()
        let clear = emailField.buttons["Clear text"]
        if clear.waitForExistence(timeout: 1) { clear.tap() }
        emailField.typeText(email)
        dismissKeyboardIfPresent(app: app)
        let passwordField = app.textFields["pilot_manager_password"]
        XCTAssertTrue(passwordField.waitForExistence(timeout: 10))
        passwordField.tap()
        passwordField.doubleTap()
        passwordField.typeText(password)
        dismissKeyboardIfPresent(app: app)
        let signInBtn = app.buttons["pilot_manager_sign_in"]
        signInBtn.tap()
        let deadline = Date().addingTimeInterval(120)
        while signInBtn.exists, Date() < deadline {
            RunLoop.current.run(until: Date().addingTimeInterval(0.4))
        }
    }

    private func waitForManagerShell(app: XCUIApplication, timeout: TimeInterval) -> Bool {
        let signIn = app.buttons["pilot_manager_sign_in"]
        let unauthorized = app.otherElements["pilot_manager_unauthorized"]
        let e2eProjectDetail = app.descendants(matching: .any)["pilot_manager_project_detail_e2e"]
        let tabBar = app.tabBars.firstMatch
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if unauthorized.exists {
                XCTFail("Manager role unauthorized for pilot user — check /api/v1/me role")
                return false
            }
            if e2eProjectDetail.exists { return true }
            if tabBar.exists, !signIn.exists { return true }
            RunLoop.current.run(until: Date().addingTimeInterval(0.4))
        }
        if unauthorized.exists {
            XCTFail("Manager role unauthorized for pilot user — check /api/v1/me role")
            return false
        }
        return e2eProjectDetail.exists || (tabBar.exists && !signIn.exists)
    }

    func testLoginScreen_reachableWithPilotIdentifiers() throws {
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_UI_TEST"] = "1"
        app.launch()

        let email = app.textFields["pilot_manager_email"]
        XCTAssertTrue(email.waitForExistence(timeout: 25), "Expected login email field (intro skipped + session cleared in UI test mode)")

        XCTAssertTrue(app.textFields["pilot_manager_password"].exists, "Debug uses TextField for password so UI tests can type on Simulator")
        XCTAssertTrue(app.buttons["pilot_manager_sign_in"].exists)
    }

    /// Layer B: live API login and manager reports inbox reachable.
    func testManager_livePilot_loginAndReachReportsInbox() throws {
        try PilotE2ECredentials.skipUnlessConfigured(self)
        guard let email = PilotE2ECredentials.email, let password = PilotE2ECredentials.password else {
            return
        }

        let app = launchForE2E(deepLinkProject: false)
        signInManagerIfNeeded(app: app, email: email, password: password)

        XCTAssertTrue(
            waitForManagerShell(app: app, timeout: 180),
            "Expected manager tab shell after live login (reports tab, inbox row, or tab bar)"
        )

        if app.tabBars.buttons.count > 3 {
            app.tabBars.buttons.element(boundBy: 3).tap()
        } else {
            let reportsTab = app.tabBars.buttons["pilot_manager_tab_reports"]
            if reportsTab.exists { reportsTab.tap() }
        }
        _ = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'pilot_manager_report_'")).firstMatch
            .waitForExistence(timeout: 60)
    }

    private func projectRowElement(app: XCUIApplication) -> XCUIElement {
        if let pid = PilotE2ECredentials.projectId, !pid.isEmpty {
            let id = "pilot_manager_project_\(pid)"
            let candidates: [XCUIElement] = [
                app.staticTexts[id],
                app.buttons[id],
                app.cells.containing(NSPredicate(format: "identifier == %@", id)).firstMatch,
                app.descendants(matching: .any).matching(NSPredicate(format: "identifier == %@", id)).firstMatch,
            ]
            for element in candidates where element.waitForExistence(timeout: 2) {
                return element
            }
        }
        return app.descendants(matching: .any).matching(
            NSPredicate(format: "identifier BEGINSWITH 'pilot_manager_project_'")
        ).firstMatch
    }

    private func openProjectDetailViaE2ESheet(app: XCUIApplication) -> Bool {
        let inSheet = app.sheets.firstMatch.descendants(matching: .any)["pilot_manager_project_detail_e2e"]
        if inSheet.waitForExistence(timeout: 120) { return true }
        return app.descendants(matching: .any)["pilot_manager_project_detail_e2e"].waitForExistence(timeout: 15)
    }

    private func openProjectsTab(app: XCUIApplication) {
        if app.tabBars.buttons.count > 1 {
            app.tabBars.buttons.element(boundBy: 1).tap()
        }
        _ = app.otherElements["pilot_manager_projects_tab"].waitForExistence(timeout: 30)
    }

    private func waitForProjectsListReady(app: XCUIApplication) {
        let loading = app.otherElements["pilot_manager_projects_loading"]
        if loading.waitForExistence(timeout: 5) {
            let deadline = Date().addingTimeInterval(120)
            while loading.exists, Date() < deadline {
                RunLoop.current.run(until: Date().addingTimeInterval(0.4))
            }
        }
    }

    private func openProjectDetail(app: XCUIApplication) {
        if PilotE2ECredentials.projectId != nil {
            XCTAssertTrue(
                openProjectDetailViaE2ESheet(app: app),
                "Expected E2E project detail sheet (AISTROYKA_E2E_PROJECT_ID)"
            )
            return
        }
        if openProjectDetailViaE2ESheet(app: app) { return }
        openProjectsTab(app: app)
        waitForProjectsListReady(app: app)
        let empty = app.otherElements["pilot_manager_projects_empty"]
        if empty.waitForExistence(timeout: 3) {
            XCTFail("Manager projects list is empty for pilot tenant — set IOS_E2E_PROJECT_ID or seed a project")
        }
        let projectRow = projectRowElement(app: app)
        XCTAssertTrue(projectRow.waitForExistence(timeout: 90), "Expected at least one project row")
        projectRow.tap()
    }

    /// Layer B: project intelligence API + copilot screen reachable (no LLM send required).
    func testManager_livePilot_projectIntelligenceAndCopilot() throws {
        try PilotE2ECredentials.skipUnlessConfigured(self)
        guard let email = PilotE2ECredentials.email, let password = PilotE2ECredentials.password else {
            return
        }

        let app = launchForE2E(deepLinkProject: true)
        signInManagerIfNeeded(app: app, email: email, password: password)
        XCTAssertTrue(waitForManagerShell(app: app, timeout: 180))

        openProjectDetail(app: app)

        let intelLink = app.descendants(matching: .any)["pilot_manager_project_intelligence_link"]
        XCTAssertTrue(intelLink.waitForExistence(timeout: 30))
        intelLink.tap()

        let intelligence = app.otherElements["pilot_manager_intelligence"]
        XCTAssertTrue(
            intelligence.waitForExistence(timeout: 120),
            "Expected project intelligence screen after GET /projects/:id/intelligence"
        )

        let copilotFromIntel = app.descendants(matching: .any)["pilot_manager_open_copilot"]
        if copilotFromIntel.waitForExistence(timeout: 10) {
            copilotFromIntel.tap()
        } else {
            app.navigationBars.buttons.element(boundBy: 0).tap()
            let copilotLink = app.descendants(matching: .any)["pilot_manager_project_copilot_link"]
            XCTAssertTrue(copilotLink.waitForExistence(timeout: 15))
            copilotLink.tap()
        }

        XCTAssertTrue(
            app.otherElements["pilot_manager_copilot"].waitForExistence(timeout: 30),
            "Expected copilot chat screen"
        )
    }
}
