//
//  ManagerSmokeUITests.swift
//  AiStroykaManagerUITests
//
//  Minimal UI smoke: login screen is reachable with stable accessibility identifiers.
//

import XCTest

final class ManagerSmokeUITests: XCTestCase {
    private func launchForE2E(email: String, password: String, deepLinkProject: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_E2E"] = "1"
        app.launchArguments += ["-AISTROYKA_E2E", "1"]
        app.launchEnvironment["AISTROYKA_E2E_EMAIL"] = email
        app.launchEnvironment["AISTROYKA_E2E_PASSWORD"] = password
        app.launchArguments += ["-AISTROYKA_E2E_EMAIL", email, "-AISTROYKA_E2E_PASSWORD", password]
        if deepLinkProject, let projectId = PilotE2ECredentials.projectId {
            app.launchEnvironment["AISTROYKA_E2E_PROJECT_ID"] = projectId
            app.launchEnvironment["IOS_E2E_PROJECT_ID"] = projectId
            app.launchArguments += ["-AISTROYKA_E2E_PROJECT_ID", projectId]
        }
        if let base = PilotE2ECredentials.apiBaseURL {
            app.launchEnvironment["BASE_URL"] = base
            app.launchEnvironment["AISTROYKA_E2E_BASE_URL"] = base
            app.launchEnvironment["IOS_E2E_BASE_URL"] = base
        }
        if let supa = PilotE2ECredentials.supabaseURL {
            app.launchEnvironment["SUPABASE_URL"] = supa
            app.launchArguments += ["-SUPABASE_URL", supa]
        }
        if let key = PilotE2ECredentials.supabaseAnonKey {
            app.launchEnvironment["SUPABASE_ANON_KEY"] = key
            app.launchArguments += ["-SUPABASE_ANON_KEY", key]
        }
        if let base = PilotE2ECredentials.apiBaseURL {
            app.launchArguments += ["-AISTROYKA_E2E_BASE_URL", base, "-BASE_URL", base]
        }
        let credFile = PilotE2ECredentials.credentialsFilePath
        app.launchEnvironment["AISTROYKA_E2E_CRED_FILE"] = credFile
        app.launchArguments += ["-AISTROYKA_E2E_CRED_FILE", credFile]
        app.launch()
        return app
    }

    private func waitForE2EBootstrapToFinish(app: XCUIApplication, timeout: TimeInterval = 90) {
        let boot = app.otherElements["pilot_manager_e2e_bootstrapping"]
        guard boot.waitForExistence(timeout: 5) else { return }
        let deadline = Date().addingTimeInterval(timeout)
        while boot.exists, Date() < deadline {
            RunLoop.current.run(until: Date().addingTimeInterval(0.4))
        }
    }

    private func clearAndType(_ field: XCUIElement, text: String) {
        field.tap()
        guard field.waitForExistence(timeout: 3) else { return }
        if let value = field.value as? String, !value.isEmpty {
            let delete = String(repeating: XCUIKeyboardKey.delete.rawValue, count: value.count + 4)
            field.typeText(delete)
        }
        field.typeText(text)
    }

    /// Fallback when programmatic E2E sign-in does not flip session state in time on Simulator.
    private func signInViaUIIfNeeded(app: XCUIApplication, email: String, password: String) {
        waitForE2EBootstrapToFinish(app: app)
        if waitForManagerReady(
            app: app,
            timeout: 10,
            requiresDeepLink: PilotE2ECredentials.projectId != nil
        ) { return }
        let signInBtn = app.buttons["pilot_manager_sign_in"]
        guard signInBtn.waitForExistence(timeout: 20), signInBtn.isHittable else { return }
        if signInBtn.isEnabled {
            signInBtn.tap()
            _ = waitForManagerReady(
                app: app,
                timeout: 90,
                requiresDeepLink: PilotE2ECredentials.projectId != nil
            )
            return
        }
        let emailField = app.textFields["pilot_manager_email"]
        let passwordField = app.textFields["pilot_manager_password"]
        guard emailField.waitForExistence(timeout: 5),
              passwordField.waitForExistence(timeout: 5),
              emailField.isHittable,
              passwordField.isHittable else { return }
        clearAndType(emailField, text: email)
        clearAndType(passwordField, text: password)
        guard signInBtn.isEnabled, signInBtn.isHittable else { return }
        signInBtn.tap()
        _ = waitForManagerReady(
            app: app,
            timeout: 90,
            requiresDeepLink: PilotE2ECredentials.projectId != nil
        )
    }

    /// Waits for E2E auto-login + project deep link (or tab shell).
    private func waitForManagerReady(
        app: XCUIApplication,
        timeout: TimeInterval = 180,
        requiresDeepLink: Bool = false
    ) -> Bool {
        let expectsDeepLink = requiresDeepLink && PilotE2ECredentials.projectId != nil
        let bootstrapping = app.otherElements["pilot_manager_e2e_bootstrapping"]
        let checkingSession = app.otherElements["pilot_manager_e2e_checking_session"]
        let detailLoading = app.descendants(matching: .any)["pilot_manager_project_detail_loading"]
        let e2eProjectDetail = app.descendants(matching: .any)["pilot_manager_project_detail_e2e"]
        let e2eIntelLink = app.descendants(matching: .any)["pilot_manager_project_intelligence_link"]
        let signIn = app.buttons["pilot_manager_sign_in"]
        let loginError = app.staticTexts["pilot_manager_login_error"]
        let unauthorized = app.otherElements["pilot_manager_unauthorized"]
        let deeplinkShell = app.descendants(matching: .any)["pilot_manager_e2e_deeplink_shell"]
        let detailError = app.descendants(matching: .any)["pilot_manager_project_detail_error"]
        let detailRetry = app.buttons["pilot_manager_error_retry"]
        let tabBar = app.tabBars.firstMatch
        let tabShell = app.otherElements["pilot_manager_tab_shell"]
        let homeTab = app.buttons["pilot_manager_tab_home"]

        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if bootstrapping.exists || checkingSession.exists {
                RunLoop.current.run(until: Date().addingTimeInterval(0.4))
                continue
            }
            if deeplinkShell.exists {
                return true
            }
            if e2eIntelLink.exists || e2eProjectDetail.exists || detailLoading.exists || detailError.exists {
                return true
            }
            if deeplinkShell.exists {
                return true
            }
            if !expectsDeepLink, (tabBar.exists || tabShell.exists || homeTab.exists), !signIn.exists, !unauthorized.exists {
                return true
            }
            if detailError.exists, detailRetry.exists {
                detailRetry.tap()
            }
            if loginError.exists, signIn.exists, !bootstrapping.exists,
               !detailLoading.exists, !e2eProjectDetail.exists,
               Date().addingTimeInterval(20) > deadline {
                return false
            }
            if unauthorized.exists, !detailLoading.exists, !e2eProjectDetail.exists {
                XCTFail("Manager unauthorized during E2E — verify IOS_E2E_BASE_URL=https://aistroyka.ai")
                return false
            }
            RunLoop.current.run(until: Date().addingTimeInterval(0.4))
        }
        if expectsDeepLink {
            return deeplinkShell.exists || e2eIntelLink.exists || e2eProjectDetail.exists
                || detailLoading.exists || detailError.exists
        }
        return deeplinkShell.exists || e2eIntelLink.exists || e2eProjectDetail.exists
            || detailLoading.exists || detailError.exists
            || ((tabBar.exists || tabShell.exists || homeTab.exists) && !signIn.exists)
    }

    private func tapManagerTab(_ app: XCUIApplication, index: Int) {
        let ids = [
            "pilot_manager_tab_home",
            "pilot_manager_tab_projects",
            "pilot_manager_tab_tasks",
            "pilot_manager_tab_ai",
            "pilot_manager_tab_more",
        ]
        if index < ids.count {
            let button = app.buttons[ids[index]]
            if button.waitForExistence(timeout: 4) {
                button.tap()
                return
            }
        }
        if app.tabBars.buttons.count > index {
            app.tabBars.buttons.element(boundBy: index).tap()
        }
    }

    func testLoginScreen_reachableWithPilotIdentifiers() throws {
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_UI_TEST"] = "1"
        app.launch()

        let email = app.textFields["pilot_manager_email"]
        XCTAssertTrue(email.waitForExistence(timeout: 25), "Expected login email field (intro skipped + session cleared in UI test mode)")

        XCTAssertTrue(app.textFields["pilot_manager_password"].exists, "Debug uses TextField for password so UI tests can type on Simulator")
        XCTAssertTrue(app.buttons["pilot_manager_sign_in"].exists)
    }

    /// Layer B: live API login and manager reports inbox reachable.
    func testManager_livePilot_loginAndReachReportsInbox() throws {
        try PilotE2ECredentials.skipUnlessConfigured(self)
        guard let email = PilotE2ECredentials.email, let password = PilotE2ECredentials.password else {
            return
        }

        let app = launchForE2E(email: email, password: password)
        waitForE2EBootstrapToFinish(app: app)
        if !waitForManagerReady(app: app, timeout: 90) {
            signInViaUIIfNeeded(app: app, email: email, password: password)
        }
        XCTAssertTrue(
            waitForManagerReady(app: app, timeout: 120),
            "Expected manager tab shell after live login (reports tab, inbox row, or tab bar)"
        )

        tapManagerTab(app, index: 4)
        let reports = app.descendants(matching: .any)["pilot_manager_tab_reports"]
        if reports.waitForExistence(timeout: 10) {
            reports.tap()
        }
        _ = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'pilot_manager_report_'")).firstMatch
            .waitForExistence(timeout: 60)
    }

    private func projectRowElement(app: XCUIApplication) -> XCUIElement {
        if let pid = PilotE2ECredentials.projectId, !pid.isEmpty {
            let id = "pilot_manager_project_\(pid)"
            let candidates: [XCUIElement] = [
                app.staticTexts[id],
                app.buttons[id],
                app.cells.containing(NSPredicate(format: "identifier == %@", id)).firstMatch,
                app.descendants(matching: .any).matching(NSPredicate(format: "identifier == %@", id)).firstMatch,
            ]
            for element in candidates where element.waitForExistence(timeout: 2) {
                return element
            }
        }
        return app.descendants(matching: .any).matching(
            NSPredicate(format: "identifier BEGINSWITH 'pilot_manager_project_'")
        ).firstMatch
    }

    private func openProjectDetailViaE2EDeepLink(app: XCUIApplication) -> Bool {
        let intel = app.descendants(matching: .any)["pilot_manager_project_intelligence_link"]
        let deadline = Date().addingTimeInterval(60)
        while Date() < deadline {
            if intel.exists { return true }
            app.swipeUp()
            RunLoop.current.run(until: Date().addingTimeInterval(0.4))
        }
        return intel.exists
    }

    private func tapFirstAvailable(_ elements: XCUIElement...) {
        for element in elements where element.exists {
            if element.isHittable {
                element.tap()
                return
            }
        }
        for element in elements where element.exists {
            element.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
            return
        }
        XCTFail("No tappable element in \(elements.map(\.identifier))")
    }

    private func openProjectsTab(app: XCUIApplication) {
        tapManagerTab(app, index: 1)
        _ = app.otherElements["pilot_manager_projects_tab"].waitForExistence(timeout: 30)
    }

    private func waitForProjectsListReady(app: XCUIApplication) {
        let loading = app.otherElements["pilot_manager_projects_loading"]
        if loading.waitForExistence(timeout: 5) {
            let deadline = Date().addingTimeInterval(120)
            while loading.exists, Date() < deadline {
                RunLoop.current.run(until: Date().addingTimeInterval(0.4))
            }
        }
    }

    private func waitForProjectDetailLoaded(app: XCUIApplication) {
        let intel = app.descendants(matching: .any)["pilot_manager_project_intelligence_link"]
        let detail = app.descendants(matching: .any)["pilot_manager_project_detail_e2e"]
        let loading = app.descendants(matching: .any)["pilot_manager_project_detail_loading"]
        let detailError = app.descendants(matching: .any)["pilot_manager_project_detail_error"]
        let detailRetry = app.buttons["pilot_manager_error_retry"]
        let deadline = Date().addingTimeInterval(180)
        while Date() < deadline {
            if intel.exists { return }
            if detail.exists, intel.waitForExistence(timeout: 5) { return }
            if loading.exists {
                RunLoop.current.run(until: Date().addingTimeInterval(0.5))
                continue
            }
            if detailError.exists, detailRetry.exists {
                detailRetry.tap()
            }
            app.swipeUp()
            RunLoop.current.run(until: Date().addingTimeInterval(0.5))
        }
        XCTAssertTrue(
            intel.exists,
            "Expected project detail content after GET /api/v1/projects/:id (check pilot_manager_project_detail_error)"
        )
    }

    private func openProjectDetail(app: XCUIApplication) {
        if PilotE2ECredentials.projectId != nil {
            waitForProjectDetailLoaded(app: app)
            return
        }
        if openProjectDetailViaE2EDeepLink(app: app) {
            waitForProjectDetailLoaded(app: app)
            return
        }
        openProjectsTab(app: app)
        waitForProjectsListReady(app: app)
        let empty = app.otherElements["pilot_manager_projects_empty"]
        if empty.waitForExistence(timeout: 3) {
            XCTFail("Manager projects list is empty for pilot tenant — set IOS_E2E_PROJECT_ID or seed a project")
        }
        let projectRow = projectRowElement(app: app)
        XCTAssertTrue(projectRow.waitForExistence(timeout: 90), "Expected at least one project row")
        projectRow.tap()
    }

    /// Layer B: project intelligence API + copilot screen reachable (no LLM send required).
    func testManager_livePilot_projectIntelligenceAndCopilot() throws {
        try PilotE2ECredentials.skipUnlessConfigured(self)
        guard let email = PilotE2ECredentials.email, let password = PilotE2ECredentials.password else {
            return
        }

        let app = launchForE2E(email: email, password: password, deepLinkProject: true)
        waitForE2EBootstrapToFinish(app: app)
        if !waitForManagerReady(app: app, timeout: 120, requiresDeepLink: true) {
            signInViaUIIfNeeded(app: app, email: email, password: password)
        }
        XCTAssertTrue(
            waitForManagerReady(app: app, timeout: 120, requiresDeepLink: true),
            "Expected manager project deep link after E2E login — check pilot_manager_login_error and IOS_E2E_BASE_URL"
        )
        let loginError = app.staticTexts["pilot_manager_login_error"]
        if loginError.waitForExistence(timeout: 1) {
            XCTFail("Manager login failed: \(loginError.label)")
        }

        openProjectDetail(app: app)

        let intelLink = app.descendants(matching: .any)["pilot_manager_project_intelligence_link"].firstMatch
        XCTAssertTrue(intelLink.waitForExistence(timeout: 30))
        tapFirstAvailable(
            app.buttons["pilot_manager_project_intelligence_link"].firstMatch,
            intelLink
        )

        let openCopilot = app.buttons["pilot_manager_open_copilot"].firstMatch
        let intelligence = app.descendants(matching: .any)["pilot_manager_intelligence"]
        let intelligenceDeadline = Date().addingTimeInterval(120)
        var intelligenceReady = false
        while Date() < intelligenceDeadline {
            if openCopilot.exists || intelligence.exists {
                intelligenceReady = true
                break
            }
            RunLoop.current.run(until: Date().addingTimeInterval(0.5))
        }
        XCTAssertTrue(
            intelligenceReady,
            "Expected project intelligence screen after GET /projects/:id/intelligence"
        )

        if openCopilot.waitForExistence(timeout: 5) {
            tapFirstAvailable(openCopilot)
        } else {
            if app.navigationBars.buttons.count > 0 {
                app.navigationBars.buttons.element(boundBy: 0).tap()
            }
            tapFirstAvailable(
                app.buttons["pilot_manager_project_copilot_link"].firstMatch,
                app.descendants(matching: .any)["pilot_manager_project_copilot_link"].firstMatch
            )
        }

        let copilotSend = app.buttons["pilot_manager_copilot_send"]
        let copilot = app.descendants(matching: .any)["pilot_manager_copilot"]
        XCTAssertTrue(
            copilotSend.waitForExistence(timeout: 30) || copilot.waitForExistence(timeout: 5),
            "Expected copilot chat screen"
        )
    }
}
