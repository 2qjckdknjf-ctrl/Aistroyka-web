import XCTest
@testable import Shared

final class ConfigPublicLegalURLTests: XCTestCase {
    func testPublicLocaleMapsSupportedCodesAndFallsBackToEnglish() {
        XCTAssertEqual(Config.publicLocaleCode(from: Locale(identifier: "ru_RU")), "ru")
        XCTAssertEqual(Config.publicLocaleCode(from: Locale(identifier: "es_ES")), "es")
        XCTAssertEqual(Config.publicLocaleCode(from: Locale(identifier: "it_IT")), "it")
        XCTAssertEqual(Config.publicLocaleCode(from: Locale(identifier: "en_US")), "en")
        XCTAssertEqual(Config.publicLocaleCode(from: Locale(identifier: "de_DE")), "en")
        XCTAssertEqual(Config.publicLocaleCode(from: Locale(identifier: "zh_CN")), "en")
    }

    func testPublicPageURLJoinsBaseLocaleAndSlug() {
        let privacy = Config.publicPageURL(slug: "privacy", locale: Locale(identifier: "ru_RU"))
        XCTAssertEqual(privacy?.path, "/ru/privacy")
        XCTAssertNotNil(privacy?.host)

        let terms = Config.publicPageURL(slug: "terms", locale: Locale(identifier: "es_MX"))
        XCTAssertEqual(terms?.path, "/es/terms")
    }

    func testPublicPageURLRejectsEmptySlug() {
        XCTAssertNil(Config.publicPageURL(slug: "   ", locale: Locale(identifier: "en")))
        XCTAssertNil(Config.publicPageURL(slug: "/", locale: Locale(identifier: "en")))
    }
}
