//
//  ManagerSmokeUITests.swift
//  AiStroykaManagerUITests
//
//  Minimal UI smoke: login screen is reachable with stable accessibility identifiers.
//

import XCTest

final class ManagerSmokeUITests: XCTestCase {
    func testLoginScreen_reachableWithPilotIdentifiers() throws {
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_UI_TEST"] = "1"
        app.launch()

        let email = app.textFields["pilot_manager_email"]
        XCTAssertTrue(email.waitForExistence(timeout: 25), "Expected login email field (intro skipped + session cleared in UI test mode)")

        XCTAssertTrue(app.textFields["pilot_manager_password"].exists, "Debug uses TextField for password so UI tests can type on Simulator")
        XCTAssertTrue(app.buttons["pilot_manager_sign_in"].exists)
    }
}
