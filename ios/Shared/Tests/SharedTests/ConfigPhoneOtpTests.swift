import XCTest
@testable import Shared

final class ConfigPhoneOtpTests: XCTestCase {
    func testPhoneOtpDefaultsOffWithoutExplicitFlag() {
        XCTAssertNil(ProcessInfo.processInfo.environment["AISTROYKA_PHONE_OTP"])
        XCTAssertFalse(Config.phoneOtpEnabled)
    }
}
