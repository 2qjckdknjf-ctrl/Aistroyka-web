//
//  WorkerSmokeUITests.swift
//  AiStroykaWorkerUITests
//
//  Minimal UI smoke: Login screen is reachable with stable accessibility identifiers.
//

import XCTest

final class WorkerSmokeUITests: XCTestCase {
    private func launchForE2E() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_E2E"] = "1"
        if let projectId = PilotE2ECredentials.projectId {
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

    private func typeText(_ text: String, into field: XCUIElement, app: XCUIApplication) {
        field.tap()
        let clear = field.buttons["Clear text"]
        if clear.waitForExistence(timeout: 1) {
            clear.tap()
        }
        field.typeText(text)
        dismissKeyboardIfPresent(app: app)
    }

    private func signInWorkerIfNeeded(app: XCUIApplication, email: String, password: String) {
        let emailField = app.textFields["pilot_worker_email"]
        guard emailField.waitForExistence(timeout: 20) else { return }
        typeText(email, into: emailField, app: app)
        let passwordField = app.textFields["pilot_worker_password"]
        XCTAssertTrue(passwordField.waitForExistence(timeout: 10))
        passwordField.tap()
        passwordField.doubleTap()
        passwordField.typeText(password)
        dismissKeyboardIfPresent(app: app)
        let signInBtn = app.buttons["pilot_worker_sign_in"]
        signInBtn.tap()
        let deadline = Date().addingTimeInterval(120)
        while signInBtn.exists, Date() < deadline {
            RunLoop.current.run(until: Date().addingTimeInterval(0.4))
        }
    }

    private func waitForWorkerHome(app: XCUIApplication, timeout: TimeInterval) -> Bool {
        let loading = app.otherElements["pilot_worker_projects_loading"]
        if loading.waitForExistence(timeout: 5) {
            let loadDeadline = Date().addingTimeInterval(min(timeout, 120))
            while loading.exists, Date() < loadDeadline {
                RunLoop.current.run(until: Date().addingTimeInterval(0.4))
            }
        }
        let newReport = app.descendants(matching: .any)["pilot_worker_new_report"]
        let home = app.otherElements["pilot_worker_home"]
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if newReport.exists || home.exists { return true }
            let projectButton = app.descendants(matching: .any).matching(
                NSPredicate(format: "identifier BEGINSWITH 'pilot_worker_project_'")
            ).firstMatch
            if projectButton.exists {
                projectButton.tap()
                if newReport.waitForExistence(timeout: 30) { return true }
            }
            RunLoop.current.run(until: Date().addingTimeInterval(0.4))
        }
        return newReport.exists || home.exists
    }

    func testLoginScreen_reachableWithPilotIdentifiers() throws {
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_UI_TEST"] = "1"
        app.launch()

        let email = app.textFields["pilot_worker_email"]
        XCTAssertTrue(email.waitForExistence(timeout: 20), "Expected login email field (intro skipped + session cleared in UI test mode)")

        XCTAssertTrue(app.textFields["pilot_worker_password"].exists, "Debug uses TextField for password so UI tests can type on Simulator")
        XCTAssertTrue(app.buttons["pilot_worker_sign_in"].exists)
    }

    /// Layer B: live API login and worker home/report entry (no photo upload in simulator).
    func testWorker_livePilot_loginAndOpenNewReportDraft() throws {
        try PilotE2ECredentials.skipUnlessConfigured(self)
        guard let email = PilotE2ECredentials.email, let password = PilotE2ECredentials.password else {
            return
        }

        let app = launchForE2E()
        signInWorkerIfNeeded(app: app, email: email, password: password)

        XCTAssertTrue(
            waitForWorkerHome(app: app, timeout: 180),
            "Expected worker home after live login (pilot_worker_new_report or pilot_worker_home)"
        )

        let newReport = app.descendants(matching: .any)["pilot_worker_new_report"]
        newReport.tap()

        let createReport = app.buttons["pilot_worker_report_create"]
        XCTAssertTrue(createReport.waitForExistence(timeout: 30), "Expected new report screen")
        createReport.tap()

        XCTAssertTrue(
            app.buttons["pilot_worker_photo_before_pick"].waitForExistence(timeout: 45),
            "Expected draft report UI with before-photo picker after create"
        )
    }
}
