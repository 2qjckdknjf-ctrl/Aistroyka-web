//
//  WorkerPhase5UITests.swift
//  AiStroykaWorkerUITests
//
//  Phase 5 Layer B: full Worker report lifecycle on a dedicated simulator.
//  Canonical Phase 5 harness must supply credentials (no XCTSkip).
//

import XCTest

final class WorkerPhase5UITests: XCTestCase {
    private func requireConfigured() {
        if ProcessInfo.processInfo.environment["IOS_PHASE5_NO_SKIP"] == "1" {
            XCTAssertTrue(
                PilotE2ECredentials.isConfigured,
                "Phase 5 requires IOS_E2E_WORKER_EMAIL/PASSWORD (harness must exit 2 before UITest if missing)"
            )
        }
    }

    private func launchWorker(
        email: String,
        password: String,
        openDraft: Bool,
        openResubmit: Bool,
        pauseQueue: Bool,
        injectMedia: Bool,
        preserveQueue: Bool
    ) -> XCUIApplication {
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
        if let taskId = PilotE2ECredentials.taskId {
            app.launchEnvironment["AISTROYKA_E2E_TASK_ID"] = taskId
            app.launchEnvironment["IOS_E2E_TASK_ID"] = taskId
            app.launchArguments += ["-AISTROYKA_E2E_TASK_ID", taskId]
        }
        if let reportId = PilotE2ECredentials.reportId {
            app.launchEnvironment["AISTROYKA_E2E_REPORT_ID"] = reportId
            app.launchEnvironment["IOS_E2E_REPORT_ID"] = reportId
            app.launchArguments += ["-AISTROYKA_E2E_REPORT_ID", reportId]
        }
        if let note = PilotE2ECredentials.workerNote {
            app.launchEnvironment["AISTROYKA_E2E_WORKER_NOTE"] = note
            app.launchEnvironment["IOS_E2E_WORKER_NOTE"] = note
            app.launchArguments += ["-AISTROYKA_E2E_WORKER_NOTE", note]
        }
        if let base = PilotE2ECredentials.apiBaseURL {
            app.launchEnvironment["BASE_URL"] = base
            app.launchEnvironment["AISTROYKA_E2E_BASE_URL"] = base
            app.launchEnvironment["IOS_E2E_BASE_URL"] = base
            app.launchArguments += ["-AISTROYKA_E2E_BASE_URL", base, "-BASE_URL", base]
        }
        if let supa = PilotE2ECredentials.supabaseURL {
            app.launchEnvironment["SUPABASE_URL"] = supa
            app.launchArguments += ["-SUPABASE_URL", supa]
        }
        if let key = PilotE2ECredentials.supabaseAnonKey {
            app.launchEnvironment["SUPABASE_ANON_KEY"] = key
            app.launchArguments += ["-SUPABASE_ANON_KEY", key]
        }
        let credFile = PilotE2ECredentials.credentialsFilePath
        app.launchEnvironment["AISTROYKA_E2E_CRED_FILE"] = credFile
        app.launchArguments += ["-AISTROYKA_E2E_CRED_FILE", credFile]
        if openDraft {
            app.launchEnvironment["AISTROYKA_E2E_OPEN_REPORT_DRAFT"] = "1"
            app.launchArguments += ["-AISTROYKA_E2E_OPEN_REPORT_DRAFT"]
        }
        if openResubmit {
            app.launchEnvironment["AISTROYKA_E2E_OPEN_RESUBMIT"] = "1"
            app.launchArguments += ["-AISTROYKA_E2E_OPEN_RESUBMIT"]
        }
        if pauseQueue {
            app.launchEnvironment["AISTROYKA_E2E_PAUSE_QUEUE"] = "1"
            app.launchArguments += ["-AISTROYKA_E2E_PAUSE_QUEUE"]
        }
        if injectMedia {
            app.launchEnvironment["AISTROYKA_E2E_INJECT_MEDIA"] = "1"
            app.launchArguments += ["-AISTROYKA_E2E_INJECT_MEDIA"]
        }
        if preserveQueue {
            app.launchEnvironment["AISTROYKA_E2E_PRESERVE_QUEUE"] = "1"
            app.launchArguments += ["-AISTROYKA_E2E_PRESERVE_QUEUE"]
        }
        app.launch()
        return app
    }

    private func waitBootstrap(_ app: XCUIApplication, timeout: TimeInterval = 90) {
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

    private func signInIfNeeded(app: XCUIApplication, email: String, password: String) {
        waitBootstrap(app)
        let createBtn = app.buttons["pilot_worker_report_create"].firstMatch
        let shell = app.descendants(matching: .any)["pilot_worker_e2e_report_draft_shell"]
        let resubmit = app.descendants(matching: .any)["pilot_worker_e2e_resubmit_shell"]
        if createBtn.waitForExistence(timeout: 4) || shell.exists || resubmit.exists { return }
        let signInBtn = app.buttons["pilot_worker_sign_in"]
        guard signInBtn.waitForExistence(timeout: 25) else { return }
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

    private func waitFor(_ query: () -> Bool, timeout: TimeInterval, step: TimeInterval = 0.5) -> Bool {
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if query() { return true }
            RunLoop.current.run(until: Date().addingTimeInterval(step))
        }
        return query()
    }

    /// Pause → durable queue → relaunch proof → resume → media upload → submit (single draft).
    func testWorker_phase5_fullSubmitWithOfflineQueue() throws {
        if ProcessInfo.processInfo.environment["IOS_PHASE5_NO_SKIP"] != "1" {
            try PilotE2ECredentials.skipUnlessConfigured(self)
        } else {
            requireConfigured()
        }
        guard let email = PilotE2ECredentials.email, let password = PilotE2ECredentials.password else {
            XCTFail("Missing worker credentials")
            return
        }

        // Phase A: enqueue create+media while queue paused; prove pending survives terminate.
        var app = launchWorker(
            email: email,
            password: password,
            openDraft: true,
            openResubmit: false,
            pauseQueue: true,
            injectMedia: true,
            preserveQueue: true
        )
        waitBootstrap(app)
        signInIfNeeded(app: app, email: email, password: password)
        if app.staticTexts["pilot_worker_login_error"].waitForExistence(timeout: 3) {
            XCTFail("Worker login failed: \(app.staticTexts["pilot_worker_login_error"].label)")
        }

        XCTAssertTrue(
            app.descendants(matching: .any)["pilot_worker_e2e_report_draft_shell"].waitForExistence(timeout: 90)
                || app.buttons["pilot_worker_report_create"].waitForExistence(timeout: 5),
            "Expected E2E report draft shell"
        )

        let createBtn = app.buttons["pilot_worker_report_create"].firstMatch
        XCTAssertTrue(createBtn.waitForExistence(timeout: 30), "Create report button")
        createBtn.tap()
        XCTAssertTrue(
            app.descendants(matching: .any)["pilot_worker_report_draft_ready"].waitForExistence(timeout: 60),
            "Draft ready after create enqueue"
        )
        XCTAssertTrue(
            app.descendants(matching: .any)["pilot_worker_queue_paused"].waitForExistence(timeout: 10),
            "Expected paused queue for offline proof"
        )

        let inject = app.buttons["pilot_worker_e2e_inject_media"].firstMatch
        XCTAssertTrue(inject.waitForExistence(timeout: 15), "E2E media inject control")
        inject.tap()

        let pending = app.descendants(matching: .any)["pilot_worker_queue_pending_count"]
        XCTAssertTrue(pending.waitForExistence(timeout: 15), "Pending queue indicator")
        XCTAssertTrue(
            waitFor({
                let label = pending.label
                if let range = label.range(of: #"queue_pending=(\d+)"#, options: .regularExpression) {
                    let num = label[range].split(separator: "=").last.flatMap { Int($0) } ?? 0
                    return num >= 1
                }
                return false
            }, timeout: 20),
            "Expected durable pending ops while paused"
        )

        app.terminate()

        // Phase B: relaunch paused — queue/draft must restore from disk.
        app = launchWorker(
            email: email,
            password: password,
            openDraft: true,
            openResubmit: false,
            pauseQueue: true,
            injectMedia: false,
            preserveQueue: true
        )
        waitBootstrap(app)
        signInIfNeeded(app: app, email: email, password: password)
        XCTAssertTrue(
            app.descendants(matching: .any)["pilot_worker_report_draft_ready"].waitForExistence(timeout: 45),
            "Draft must restore after relaunch"
        )
        XCTAssertTrue(
            app.descendants(matching: .any)["pilot_worker_queue_paused"].waitForExistence(timeout: 20),
            "Queue remains paused after relaunch"
        )
        XCTAssertTrue(
            app.descendants(matching: .any)["pilot_worker_queue_pending_count"].waitForExistence(timeout: 15),
            "Pending ops restored from disk"
        )

        // Phase C: resume in same process — process queue, submit.
        let resume = app.buttons["pilot_worker_queue_resume"].firstMatch
        XCTAssertTrue(resume.waitForExistence(timeout: 20), "Resume control required")
        resume.tap()

        let noteField = app.textFields["pilot_worker_report_note"].firstMatch
        let noteArea = app.textViews["pilot_worker_report_note"].firstMatch
        let submitBtn = app.buttons["pilot_worker_submit_report"].firstMatch
        let submitReady = waitFor({
            if app.descendants(matching: .any)["pilot_worker_queue_failed_op"].exists {
                return true
            }
            return submitBtn.exists && submitBtn.isHittable
        }, timeout: 240)
        if app.descendants(matching: .any)["pilot_worker_queue_failed_op"].exists {
            XCTFail("Queue permanent failure: \(app.descendants(matching: .any)["pilot_worker_queue_failed_op"].label)")
        }
        XCTAssertTrue(submitReady, "Submit enabled after before/after media attach succeeded")
        if noteField.waitForExistence(timeout: 2) {
            if let note = PilotE2ECredentials.workerNote { clearAndType(noteField, text: note) }
        } else if noteArea.waitForExistence(timeout: 2) {
            if let note = PilotE2ECredentials.workerNote { clearAndType(noteArea, text: note) }
        }
        submitBtn.tap()
        XCTAssertTrue(
            app.descendants(matching: .any)["pilot_worker_report_submitted"].waitForExistence(timeout: 180),
            "Expected submitted state after queue finalize"
        )
    }

    /// After Manager changes_requested: open exact report, see note, resubmit.
    func testWorker_phase5_resubmitAfterChangesRequested() throws {
        if ProcessInfo.processInfo.environment["IOS_PHASE5_NO_SKIP"] != "1" {
            try PilotE2ECredentials.skipUnlessConfigured(self)
        } else {
            requireConfigured()
        }
        guard let email = PilotE2ECredentials.email, let password = PilotE2ECredentials.password else {
            XCTFail("Missing worker credentials")
            return
        }
        XCTAssertNotNil(PilotE2ECredentials.reportId, "IOS_E2E_REPORT_ID required for resubmit")

        let app = launchWorker(
            email: email,
            password: password,
            openDraft: false,
            openResubmit: true,
            pauseQueue: false,
            injectMedia: false,
            preserveQueue: false
        )
        waitBootstrap(app)
        signInIfNeeded(app: app, email: email, password: password)

        XCTAssertTrue(
            app.descendants(matching: .any)["pilot_worker_e2e_resubmit_shell"].waitForExistence(timeout: 90)
                || app.descendants(matching: .any)["pilot_worker_resubmit_compose"].waitForExistence(timeout: 30),
            "Expected resubmit shell"
        )
        XCTAssertTrue(
            app.descendants(matching: .any)["pilot_worker_manager_note"].waitForExistence(timeout: 60),
            "Worker must see manager note"
        )

        let reply = app.textFields["pilot_worker_resubmit_note"].firstMatch
        let replyArea = app.textViews["pilot_worker_resubmit_note"].firstMatch
        if reply.waitForExistence(timeout: 5) {
            clearAndType(reply, text: "PHASE5 resubmit \(PilotE2ECredentials.workerNote ?? "ok")")
        } else if replyArea.waitForExistence(timeout: 5) {
            clearAndType(replyArea, text: "PHASE5 resubmit \(PilotE2ECredentials.workerNote ?? "ok")")
        }

        let again = app.buttons["pilot_worker_submit_again"].firstMatch
        XCTAssertTrue(again.waitForExistence(timeout: 30), "Submit again")
        again.tap()
        XCTAssertTrue(
            app.descendants(matching: .any)["pilot_worker_resubmit_submitted"].waitForExistence(timeout: 180),
            "Resubmit succeeded"
        )
    }
}
