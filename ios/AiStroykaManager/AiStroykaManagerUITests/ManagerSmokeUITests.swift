//
//  ManagerSmokeUITests.swift
//  AiStroykaManagerUITests
//
//  Minimal UI smoke: login screen is reachable with stable accessibility identifiers.
//

import XCTest

final class ManagerSmokeUITests: XCTestCase {
    private func launchForE2E() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_E2E"] = "1"
        app.launch()
        return app
    }

    private func signInManager(app: XCUIApplication, email: String, password: String) {
        let emailField = app.textFields["pilot_manager_email"]
        XCTAssertTrue(emailField.waitForExistence(timeout: 25))
        emailField.tap()
        emailField.typeText(email)
        let passwordField = app.textFields["pilot_manager_password"]
        XCTAssertTrue(passwordField.exists)
        passwordField.tap()
        passwordField.typeText(password)
        app.buttons["pilot_manager_sign_in"].tap()
    }

    private func waitForManagerShell(app: XCUIApplication, timeout: TimeInterval) -> Bool {
        let signIn = app.buttons["pilot_manager_sign_in"]
        let reportsTab = app.tabBars.buttons["pilot_manager_tab_reports"]
        let reportRow = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'pilot_manager_report_'")).firstMatch
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if reportsTab.exists || reportRow.exists { return true }
            if !signIn.exists, app.tabBars.buttons.count > 0 { return true }
            RunLoop.current.run(until: Date().addingTimeInterval(0.4))
        }
        return reportsTab.exists || reportRow.exists || (!signIn.exists && app.tabBars.buttons.count > 0)
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

        let app = launchForE2E()
        signInManager(app: app, email: email, password: password)

        XCTAssertTrue(
            waitForManagerShell(app: app, timeout: 120),
            "Expected manager tab shell after live login (reports tab, inbox row, or tab bar)"
        )

        let reportsTab = app.tabBars.buttons["pilot_manager_tab_reports"]
        if reportsTab.exists {
            reportsTab.tap()
        }
    }
}
