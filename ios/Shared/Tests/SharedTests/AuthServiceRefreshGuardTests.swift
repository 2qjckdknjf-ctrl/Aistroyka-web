import XCTest
@testable import Shared

final class AuthServiceRefreshGuardTests: XCTestCase {
    func testPersistAllowedWhenSessionUnchanged() {
        XCTAssertTrue(
            AuthService.canPersistRefreshedSession(
                startedEpoch: 3,
                currentEpoch: 3,
                startedRefreshToken: "refresh-a",
                currentRefreshToken: "refresh-a"
            )
        )
    }

    func testPersistRejectedAfterLogoutEpochBump() {
        XCTAssertFalse(
            AuthService.canPersistRefreshedSession(
                startedEpoch: 3,
                currentEpoch: 4,
                startedRefreshToken: "refresh-a",
                currentRefreshToken: nil
            )
        )
    }

    func testPersistRejectedWhenRefreshRotatedToAnotherSession() {
        XCTAssertFalse(
            AuthService.canPersistRefreshedSession(
                startedEpoch: 3,
                currentEpoch: 3,
                startedRefreshToken: "refresh-a",
                currentRefreshToken: "refresh-b"
            )
        )
    }

    func testPersistRejectedForEmptyStartedRefresh() {
        XCTAssertFalse(
            AuthService.canPersistRefreshedSession(
                startedEpoch: 1,
                currentEpoch: 1,
                startedRefreshToken: "",
                currentRefreshToken: ""
            )
        )
    }
}
