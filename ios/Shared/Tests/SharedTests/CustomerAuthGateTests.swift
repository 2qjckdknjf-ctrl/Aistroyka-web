import XCTest
@testable import Shared

final class CustomerAuthGateTests: XCTestCase {
    func testAllowsStakeholderOnly() {
        XCTAssertTrue(CustomerAuthGate.allowsCustomerSession(role: "stakeholder"))
        XCTAssertTrue(CustomerAuthGate.allowsCustomerSession(role: " Stakeholder "))
        XCTAssertFalse(CustomerAuthGate.allowsCustomerSession(role: nil))
        XCTAssertFalse(CustomerAuthGate.allowsCustomerSession(role: ""))
        XCTAssertFalse(CustomerAuthGate.allowsCustomerSession(role: "member"))
        XCTAssertFalse(CustomerAuthGate.allowsCustomerSession(role: "owner"))
        XCTAssertFalse(CustomerAuthGate.allowsCustomerSession(role: "admin"))
        XCTAssertFalse(CustomerAuthGate.allowsCustomerSession(role: "viewer"))
    }

    func testContractorWrongApp() {
        XCTAssertTrue(CustomerAuthGate.contractorRoleUsingWrongApp("owner"))
        XCTAssertTrue(CustomerAuthGate.contractorRoleUsingWrongApp("admin"))
        XCTAssertTrue(CustomerAuthGate.contractorRoleUsingWrongApp("member"))
        XCTAssertFalse(CustomerAuthGate.contractorRoleUsingWrongApp("stakeholder"))
        XCTAssertFalse(CustomerAuthGate.contractorRoleUsingWrongApp(nil))
    }

    func testCustomerProfileHeader() {
        XCTAssertEqual(MobileClientProfile.customer.rawValue, "ios_customer")
        XCTAssertNotEqual(MobileClientProfile.customer.rawValue, MobileClientProfile.manager.rawValue)
        XCTAssertNotEqual(MobileClientProfile.customer.rawValue, MobileClientProfile.worker.rawValue)
    }
}
