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
        app.launch()
        return app
    }

    private func signInWorker(app: XCUIApplication, email: String, password: String) {
        let emailField = app.textFields["pilot_worker_email"]
        XCTAssertTrue(emailField.waitForExistence(timeout: 25))
        emailField.tap()
        emailField.typeText(email)
        let passwordField = app.textFields["pilot_worker_password"]
        XCTAssertTrue(passwordField.exists)
        passwordField.tap()
        passwordField.typeText(password)
        app.buttons["pilot_worker_sign_in"].tap()
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
        signInWorker(app: app, email: email, password: password)

        let projectButton = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'pilot_worker_project_'")).firstMatch
        if projectButton.waitForExistence(timeout: 45) {
            projectButton.tap()
        }

        let newReport = app.buttons["pilot_worker_new_report"]
        XCTAssertTrue(newReport.waitForExistence(timeout: 60), "Expected worker home after live login (project list or home)")
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
