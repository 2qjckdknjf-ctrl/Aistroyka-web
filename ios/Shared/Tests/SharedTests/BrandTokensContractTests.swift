import XCTest
@testable import Shared

final class BrandTokensContractTests: XCTestCase {
    func testBrandSurfacesAndStatesExist() {
        XCTAssertNotNil(BrandTokens.bgPage)
        XCTAssertNotNil(BrandTokens.bgSecondary)
        XCTAssertNotNil(BrandTokens.surface)
        XCTAssertNotNil(BrandTokens.stateError)
        XCTAssertNotNil(BrandTokens.stateSuccess)
        XCTAssertNotNil(BrandTokens.textPrimary)
        XCTAssertNotNil(BrandTokens.textSecondary)
    }

    func testMobileClientProfilesStable() {
        XCTAssertEqual(MobileClientProfile.worker.rawValue, "ios_worker")
        XCTAssertEqual(MobileClientProfile.manager.rawValue, "ios_manager")
    }
}
