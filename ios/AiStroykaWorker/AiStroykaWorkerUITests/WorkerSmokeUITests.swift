//
//  WorkerSmokeUITests.swift
//  AiStroykaWorkerUITests
//
//  Minimal UI smoke: Login screen is reachable with stable accessibility identifiers.
//

import XCTest

final class WorkerSmokeUITests: XCTestCase {
    func testLoginScreen_reachableWithPilotIdentifiers() throws {
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_UI_TEST"] = "1"
        app.launch()

        let email = app.textFields["pilot_worker_email"]
        XCTAssertTrue(email.waitForExistence(timeout: 20), "Expected login email field (intro skipped + session cleared in UI test mode)")

        XCTAssertTrue(app.textFields["pilot_worker_password"].exists, "Debug uses TextField for password so UI tests can type on Simulator")
        XCTAssertTrue(app.buttons["pilot_worker_sign_in"].exists)
    }
}
