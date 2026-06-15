//
//  WorkerSmokeUITests.swift
//  AiStroykaWorkerUITests
//
//  Minimal UI smoke: Login screen is reachable with stable accessibility identifiers.
//

import XCTest

final class WorkerSmokeUITests: XCTestCase {
    private func launchForE2E(email: String, password: String) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_E2E"] = "1"
        app.launchArguments += ["-AISTROYKA_E2E", "1"]
        app.launchEnvironment["AISTROYKA_E2E_EMAIL"] = email
        app.launchEnvironment["AISTROYKA_E2E_PASSWORD"] = password
        app.launchArguments += ["-AISTROYKA_E2E_EMAIL", email, "-AISTROYKA_E2E_PASSWORD", password]
        if let projectId = PilotE2ECredentials.projectId {
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
        app.launchEnvironment["AISTROYKA_E2E_OPEN_REPORT_DRAFT"] = "1"
        app.launchArguments += ["-AISTROYKA_E2E_OPEN_REPORT_DRAFT"]
        app.launch()
        return app
    }

    private func waitForE2EBootstrapToFinish(app: XCUIApplication, timeout: TimeInterval = 90) {
        let boot = app.otherElements["pilot_worker_e2e_bootstrapping"]
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

    private func signInViaUIIfNeeded(app: XCUIApplication, email: String, password: String) {
        waitForE2EBootstrapToFinish(app: app)
        if waitForWorkerHome(app: app, timeout: 5) { return }
        let signInBtn = app.buttons["pilot_worker_sign_in"]
        guard signInBtn.waitForExistence(timeout: 30) else { return }
        let emailField = app.textFields["pilot_worker_email"]
        let passwordField = app.textFields["pilot_worker_password"]
        guard emailField.waitForExistence(timeout: 5), passwordField.waitForExistence(timeout: 5) else { return }
        clearAndType(emailField, text: email)
        clearAndType(passwordField, text: password)
        signInBtn.tap()
        let deadline = Date().addingTimeInterval(90)
        while signInBtn.exists, Date() < deadline {
            RunLoop.current.run(until: Date().addingTimeInterval(0.4))
        }
    }

    private func tapWhenHittable(_ element: XCUIElement, in app: XCUIApplication, scrollAttempts: Int = 5) {
        for _ in 0..<scrollAttempts {
            if element.exists, element.isHittable {
                element.tap()
                return
            }
            app.swipeUp()
            RunLoop.current.run(until: Date().addingTimeInterval(0.35))
        }
        XCTAssertTrue(element.waitForExistence(timeout: 10))
        element.tap()
    }

    private func waitForWorkerHome(app: XCUIApplication, timeout: TimeInterval) -> Bool {
        let loading = app.otherElements["pilot_worker_projects_loading"]
        if loading.waitForExistence(timeout: 5) {
            let loadDeadline = Date().addingTimeInterval(min(timeout, 60))
            while loading.exists, Date() < loadDeadline {
                RunLoop.current.run(until: Date().addingTimeInterval(0.4))
            }
        }
        let newReport = app.descendants(matching: .any)["pilot_worker_new_report"]
        let home = app.otherElements["pilot_worker_home"]
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if newReport.exists || home.exists { return true }
            let projectButton = app.descendants(matching: .any).matching(
                NSPredicate(format: "identifier BEGINSWITH 'pilot_worker_project_'")
            ).firstMatch
            if projectButton.exists {
                projectButton.tap()
                if newReport.waitForExistence(timeout: 30) { return true }
            }
            RunLoop.current.run(until: Date().addingTimeInterval(0.4))
        }
        return newReport.exists || home.exists
    }

    func testLoginScreen_reachableWithPilotIdentifiers() throws {
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_UI_TEST"] = "1"
        app.launch()

        let email = app.textFields["pilot_worker_email"]
        XCTAssertTrue(email.waitForExistence(timeout: 20), "Expected login email field (intro skipped + session cleared in UI test mode)")

        XCTAssertTrue(app.textFields["pilot_worker_password"].exists, "Debug uses TextField for password so UI tests can type on Simulator")
        XCTAssertTrue(app.buttons["pilot_worker_sign_in"].exists)
    }

    /// Layer B: live API login and worker home/report entry (no photo upload in simulator).
    func testWorker_livePilot_loginAndOpenNewReportDraft() throws {
        try PilotE2ECredentials.skipUnlessConfigured(self)
        guard let email = PilotE2ECredentials.email, let password = PilotE2ECredentials.password else {
            return
        }

        let app = launchForE2E(email: email, password: password)
        waitForE2EBootstrapToFinish(app: app)
        let draftShellEarly = app.descendants(matching: .any)["pilot_worker_e2e_report_draft_shell"]
        if !draftShellEarly.waitForExistence(timeout: 5),
           !waitForWorkerHome(app: app, timeout: 30) {
            signInViaUIIfNeeded(app: app, email: email, password: password)
        }
        let loginError = app.staticTexts["pilot_worker_login_error"]
        if loginError.waitForExistence(timeout: 3) {
            XCTFail("Worker login failed: \(loginError.label)")
        }

        let draftShell = app.descendants(matching: .any)["pilot_worker_e2e_report_draft_shell"]
        let newReport = app.buttons["pilot_worker_new_report"].firstMatch
        let compose = app.descendants(matching: .any)["pilot_worker_report_compose"]
        let createBtn = app.buttons["pilot_worker_report_create"].firstMatch
        let readyDeadline = Date().addingTimeInterval(90)
        var reportEntryReady = false
        while Date() < readyDeadline {
            if draftShell.exists || newReport.exists || compose.exists || createBtn.exists {
                reportEntryReady = true
                break
            }
            RunLoop.current.run(until: Date().addingTimeInterval(0.4))
        }
        XCTAssertTrue(
            reportEntryReady,
            "Expected worker home or E2E report draft shell after sign-in. Check pilot_worker_login_error."
        )

        if !draftShell.exists, !compose.exists, !createBtn.exists, newReport.waitForExistence(timeout: 5) {
            newReport.tap()
        }

        if createBtn.waitForExistence(timeout: 15) {
            tapWhenHittable(createBtn, in: app)
        }

        let draftReady = app.descendants(matching: .any)["pilot_worker_report_draft_ready"]
        let photoPick = app.descendants(matching: .any)["pilot_worker_photo_before_pick"]
        let draftDeadline = Date().addingTimeInterval(45)
        var draftUiReady = false
        while Date() < draftDeadline {
            if draftReady.exists || photoPick.exists { draftUiReady = true; break }
            RunLoop.current.run(until: Date().addingTimeInterval(0.4))
        }
        XCTAssertTrue(
            draftUiReady,
            "Expected draft report UI with before-photo picker after create"
        )
    }
}
