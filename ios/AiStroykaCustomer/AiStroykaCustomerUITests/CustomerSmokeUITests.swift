import XCTest
import Network

final class CustomerSmokeUITests: XCTestCase {
    func testLiveDeploymentHealth() async throws {
        guard let expected = ProcessInfo.processInfo.environment["CUSTOMER_E2E_EXPECTED_SHA7"],
              expected.count == 7 else { throw XCTSkip("Reviewed runtime SHA is not configured") }
        let monitor = NWPathMonitor()
        let pathReady = expectation(description: "Device network path")
        monitor.pathUpdateHandler = { path in
            print("CUSTOMER_DEVICE_NETWORK wifi=\(path.usesInterfaceType(.wifi)) cellular=\(path.usesInterfaceType(.cellular)) wired=\(path.usesInterfaceType(.wiredEthernet)) status=\(path.status)")
            pathReady.fulfill()
        }
        monitor.start(queue: DispatchQueue(label: "CustomerDeviceNetworkProbe"))
        await fulfillment(of: [pathReady], timeout: 5)
        monitor.cancel()
        for host in ["staging.aistroyka.ai", "aistroyka.ai", "www.aistroyka.ai"] {
            var request = URLRequest(url: URL(string: "https://" + host + "/api/v1/health")!)
            request.timeoutInterval = 15
            let (data, response) = try await URLSession.shared.data(for: request)
            XCTAssertEqual((response as? HTTPURLResponse)?.statusCode, 200, host)
            let json = try XCTUnwrap(try JSONSerialization.jsonObject(with: data) as? [String: Any])
            let stamp = try XCTUnwrap(json["buildStamp"] as? [String: Any])
            XCTAssertEqual(stamp["sha7"] as? String, expected, host)
        }
    }

    /// Opt-in live functional QA. Supply an isolated fixture via the test runner,
    /// never credentials/resources embedded in the application or repository.
    @MainActor
    func testLiveCustomerProjectAndIntake() async throws {
        let env = ProcessInfo.processInfo.environment
        let required = ["CUSTOMER_E2E_EMAIL", "CUSTOMER_E2E_PASSWORD", "CUSTOMER_E2E_PROJECT_ID",
                        "CUSTOMER_E2E_BASE_URL", "CUSTOMER_E2E_INTAKE_TITLE",
                        "CUSTOMER_E2E_SUPABASE_URL", "CUSTOMER_E2E_ANON_KEY"]
        guard required.allSatisfy({ !(env[$0] ?? "").isEmpty }) else {
            throw XCTSkip("Live Customer fixture is not configured")
        }
        continueAfterFailure = false
        let expectedProjectId = env["CUSTOMER_E2E_PROJECT_ID"]!
        let fixtureTitle = env["CUSTOMER_E2E_INTAKE_TITLE"]!
        guard env["CUSTOMER_E2E_BASE_URL"] == "https://staging.aistroyka.ai",
              fixtureTitle.hasPrefix("qa-device-"), fixtureTitle.hasSuffix("-intake") else {
            throw XCTSkip("Live scenario requires an isolated staging fixture")
        }
        // Distinguish a device/Auth connectivity failure from UI input or portal
        // failures. This session is local to the probe and is revoked immediately.
        var authRequest = URLRequest(url: URL(string: env["CUSTOMER_E2E_SUPABASE_URL"]! + "/auth/v1/token?grant_type=password")!)
        authRequest.httpMethod = "POST"
        authRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        authRequest.setValue(env["CUSTOMER_E2E_ANON_KEY"], forHTTPHeaderField: "apikey")
        authRequest.httpBody = try JSONSerialization.data(withJSONObject: [
            "email": env["CUSTOMER_E2E_EMAIL"]!, "password": env["CUSTOMER_E2E_PASSWORD"]!
        ])
        let (authData, authResponse) = try await URLSession.shared.data(for: authRequest)
        XCTAssertEqual((authResponse as? HTTPURLResponse)?.statusCode, 200, "Device Auth preflight must succeed")
        let session = try XCTUnwrap(try JSONSerialization.jsonObject(with: authData) as? [String: Any])
        let token = try XCTUnwrap(session["access_token"] as? String)
        var projectRequest = URLRequest(url: URL(string: env["CUSTOMER_E2E_BASE_URL"]! + "/api/v1/portal/projects/" + expectedProjectId)!)
        projectRequest.timeoutInterval = 20
        projectRequest.setValue("Bearer " + token, forHTTPHeaderField: "Authorization")
        projectRequest.setValue("ios_customer", forHTTPHeaderField: "x-client")
        let (projectData, projectResponse) = try await URLSession.shared.data(for: projectRequest)
        let diagnostic = (try? JSONSerialization.jsonObject(with: projectData)) as? [String: Any]
        let reason = (diagnostic?["error"] as? String) ?? "non-JSON response"
        let challenge = (projectResponse as? HTTPURLResponse)?.value(forHTTPHeaderField: "cf-mitigated") ?? "none"
        XCTAssertEqual((projectResponse as? HTTPURLResponse)?.statusCode, 200,
                       "Portal preflight failed: \(reason); Cloudflare mitigation: \(challenge)")
        let portal = try XCTUnwrap(try JSONSerialization.jsonObject(with: projectData) as? [String: Any])
        let view = try XCTUnwrap(portal["data"] as? [String: Any])
        let projectInfo = try XCTUnwrap(view["project"] as? [String: Any])
        XCTAssertEqual(projectInfo["id"] as? String, expectedProjectId)
        XCTAssertEqual(projectInfo["name"] as? String, String(fixtureTitle.dropLast("-intake".count)),
                       "Refuse UI writes unless the project is the exact synthetic fixture")
        let portalJSON = String(decoding: projectData, as: UTF8.self)
        XCTAssertFalse(portalJSON.contains("987654.32"))
        XCTAssertFalse(portalJSON.contains("123456.78"))
        var logout = URLRequest(url: URL(string: env["CUSTOMER_E2E_SUPABASE_URL"]! + "/auth/v1/logout?scope=local")!)
        logout.httpMethod = "POST"
        logout.setValue(env["CUSTOMER_E2E_ANON_KEY"], forHTTPHeaderField: "apikey")
        logout.setValue("Bearer " + token, forHTTPHeaderField: "Authorization")
        if env["CUSTOMER_E2E_REVOCATION_PROBE"] != "1" {
            let (_, logoutResponse) = try await URLSession.shared.data(for: logout)
            XCTAssertEqual((logoutResponse as? HTTPURLResponse)?.statusCode, 204)
        }
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_E2E"] = "1"
        app.launchEnvironment["AISTROYKA_E2E_BASE_URL"] = env["CUSTOMER_E2E_BASE_URL"]
        app.launchEnvironment["AISTROYKA_E2E_EMAIL"] = env["CUSTOMER_E2E_EMAIL"]
        app.launchEnvironment["AISTROYKA_E2E_PASSWORD"] = env["CUSTOMER_E2E_PASSWORD"]
        app.launch()

        let previousSignOut = app.buttons["pilot_customer_sign_out"]
        if previousSignOut.waitForExistence(timeout: 3) { previousSignOut.tap() }
        let email = app.textFields["pilot_customer_email"]
        XCTAssertTrue(email.waitForExistence(timeout: 20))
        let password = app.secureTextFields["pilot_customer_password"]
        XCTAssertTrue(password.exists)
        // Credentials are prefilled only in an explicitly enabled Debug E2E
        // launch. The sign-in button still calls the actual app Auth service;
        // no token/session, role or backend response is fabricated.
        XCTAssertEqual(app.buttons["pilot_customer_sign_in"].value as? String, "fixture_match",
                       "Debug fixture comparison must confirm exact input without exposing credentials")
        app.buttons["pilot_customer_sign_in"].tap()

        let project = app.descendants(matching: .any)
            .matching(identifier: "pilot_customer_project_" + env["CUSTOMER_E2E_PROJECT_ID"]!).firstMatch
        let projectLoaded = project.waitForExistence(timeout: 40)
        if !projectLoaded {
            let state = XCTAttachment(screenshot: app.screenshot())
            state.name = "Customer state after live login"
            state.lifetime = .keepAlways
            add(state)
        }
        XCTAssertTrue(projectLoaded, "Authorized fixture project must load from the live portal")
        project.tap()
        XCTAssertTrue(app.scrollViews["pilot_customer_project_detail"].waitForExistence(timeout: 30))
        app.buttons["pilot_customer_project_intake_nav"].tap()
        XCTAssertTrue(app.textFields["pilot_customer_intake_title"].waitForExistence(timeout: 20))
        app.textFields["pilot_customer_intake_title"].tap()
        app.textFields["pilot_customer_intake_title"].typeText(env["CUSTOMER_E2E_INTAKE_TITLE"]!)
        let description = app.descendants(matching: .any)
            .matching(identifier: "pilot_customer_intake_description").firstMatch
        description.tap()
        description.typeText("Synthetic device verification; remove with fixture cleanup.")

        app.buttons["pilot_customer_keyboard_done"].tap()
        let create = app.buttons["pilot_customer_intake_create"]
        let intakeScroll = app.scrollViews["pilot_customer_intake"]
        for _ in 0..<8 where !create.isHittable { intakeScroll.swipeUp() }
        if !create.isHittable {
            let state = XCTAttachment(screenshot: app.screenshot())
            state.name = "Intake save control state"
            state.lifetime = .keepAlways
            add(state)
        }
        XCTAssertTrue(create.isHittable)
        create.tap()
        XCTAssertTrue(app.staticTexts[env["CUSTOMER_E2E_INTAKE_TITLE"]!].waitForExistence(timeout: 30),
                      "Saved draft must appear in the reloaded live list")

        app.navigationBars.buttons.element(boundBy: 0).tap()
        if env["CUSTOMER_E2E_REVOCATION_PROBE"] == "1" {
            // An external fixture coordinator revokes only this synthetic grant
            // once the draft is persisted. No service credential enters iOS.
            XCTAssertTrue(app.scrollViews["pilot_customer_project_detail"].waitForExistence(timeout: 20))
            FileHandle.standardOutput.write(Data("CUSTOMER_E2E_REVOCATION_READY\n".utf8))
            let deadline = Date().addingTimeInterval(60)
            var denied = false
            while Date() < deadline && !denied {
                projectRequest.timeoutInterval = 5
                let (_, response) = try await URLSession.shared.data(for: projectRequest)
                let status = (response as? HTTPURLResponse)?.statusCode
                denied = status == 403 || status == 404
                if denied { print("CUSTOMER_PORTAL_AFTER_REVOCATION HTTP\(status!)") }
                if !denied { try await Task.sleep(nanoseconds: 1_000_000_000) }
            }
            XCTAssertTrue(denied, "Fixture coordinator must revoke the exact grant")
            let (_, logoutResponse) = try await URLSession.shared.data(for: logout)
            XCTAssertEqual((logoutResponse as? HTTPURLResponse)?.statusCode, 204)
            app.buttons["pilot_customer_project_refresh"].tap()
            XCTAssertTrue(app.descendants(matching: .any)["pilot_customer_project_unavailable"].waitForExistence(timeout: 20))
            XCTAssertFalse(app.scrollViews["pilot_customer_project_detail"].exists,
                           "Access denial must discard the cached customer projection")
            XCTAssertFalse(app.buttons["pilot_customer_project_intake_nav"].exists)
        }
        app.navigationBars.buttons.element(boundBy: 0).tap()
        app.buttons["pilot_customer_sign_out"].tap()
        XCTAssertTrue(email.waitForExistence(timeout: 20))
    }

    @MainActor
    func testLoginScreen_reachableWithPilotIdentifiers() {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.textFields["pilot_customer_email"].waitForExistence(timeout: 20))
        XCTAssertTrue(app.secureTextFields["pilot_customer_password"].exists)
        XCTAssertTrue(app.buttons["pilot_customer_sign_in"].exists)
        XCTAssertTrue(app.buttons["pilot_customer_apple_sign_in"].exists)
        XCTAssertTrue(app.buttons["pilot_customer_google_sign_in"].exists)
    }
    @MainActor
    func testLivePublishedPhotoGallery() throws {
        let env = ProcessInfo.processInfo.environment
        let keys = ["CUSTOMER_E2E_EMAIL", "CUSTOMER_E2E_PASSWORD", "CUSTOMER_E2E_PROJECT_ID", "CUSTOMER_E2E_EVIDENCE_ID", "CUSTOMER_E2E_TAG", "CUSTOMER_E2E_BASE_URL"]
        guard keys.allSatisfy({ !(env[$0] ?? "").isEmpty }) else { throw XCTSkip("Requires a scoped synthetic published-photo fixture") }
        let projectId = env["CUSTOMER_E2E_PROJECT_ID"]!, evidenceId = env["CUSTOMER_E2E_EVIDENCE_ID"]!, tag = env["CUSTOMER_E2E_TAG"]!
        guard UUID(uuidString: projectId) != nil, UUID(uuidString: evidenceId) != nil,
              tag.hasPrefix("qa-published-evidence-"), env["CUSTOMER_E2E_EMAIL"] == tag + "@example.com",
              env["CUSTOMER_E2E_BASE_URL"] == "https://staging.aistroyka.ai" else { XCTFail("Unexpected fixture scope"); return }
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_E2E"] = "1"
        app.launchEnvironment["AISTROYKA_E2E_BASE_URL"] = env["CUSTOMER_E2E_BASE_URL"]
        app.launchEnvironment["AISTROYKA_E2E_EMAIL"] = env["CUSTOMER_E2E_EMAIL"]
        app.launchEnvironment["AISTROYKA_E2E_PASSWORD"] = env["CUSTOMER_E2E_PASSWORD"]
        app.launch()
        if app.buttons["pilot_customer_sign_out"].waitForExistence(timeout: 3) { app.buttons["pilot_customer_sign_out"].tap() }
        XCTAssertTrue(app.textFields["pilot_customer_email"].waitForExistence(timeout: 20))
        XCTAssertEqual(app.buttons["pilot_customer_sign_in"].value as? String, "fixture_match")
        app.buttons["pilot_customer_sign_in"].tap()
        let project = app.descendants(matching: .any).matching(identifier: "pilot_customer_project_" + projectId).firstMatch
        guard project.waitForExistence(timeout: 40) else { XCTFail("Synthetic project not available after actual sign-in"); return }
        project.tap()
        let photo = app.images.matching(identifier: "pilot_customer_published_photo_image_" + evidenceId).firstMatch
        XCTAssertTrue(photo.waitForExistence(timeout: 45), "Published original must decode into an actual image")
        let screen = XCTAttachment(screenshot: app.screenshot()); screen.name = "Synthetic published photo decoded"; screen.lifetime = .keepAlways; add(screen)
        app.navigationBars.buttons.element(boundBy: 0).tap()
        app.buttons["pilot_customer_sign_out"].tap()
        XCTAssertTrue(app.textFields["pilot_customer_email"].waitForExistence(timeout: 20))
    }

}
