import XCTest

final class CustomerSmokeUITests: XCTestCase {
    func testLoginScreen_reachableWithPilotIdentifiers() {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.textFields["pilot_customer_email"].waitForExistence(timeout: 20))
        XCTAssertTrue(app.secureTextFields["pilot_customer_password"].exists)
        XCTAssertTrue(app.buttons["pilot_customer_sign_in"].exists)
        XCTAssertTrue(app.buttons["pilot_customer_apple_sign_in"].exists)
        XCTAssertTrue(app.buttons["pilot_customer_google_sign_in"].exists)
    }
}
