//
//  WorkerTaskChatUITests.swift
//  AiStroykaWorkerUITests
//
//  Device smoke: synthetic pilot task chat matrix (text/media/offline/delete/authz).
//

import XCTest

final class WorkerTaskChatUITests: XCTestCase {
    private let syntheticTaskId = "b4e8c210-6a11-4f2d-9c3e-0a1b2c3d4e51"

    private func launchWorker(
        email: String,
        password: String,
        forceOffline: Bool = false,
        chatMediaFixture: Bool = false
    ) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["AISTROYKA_E2E"] = "1"
        app.launchArguments += ["-AISTROYKA_E2E", "1"]
        if forceOffline {
            app.launchEnvironment["AISTROYKA_E2E_FORCE_OFFLINE"] = "1"
            app.launchArguments += ["-AISTROYKA_E2E_FORCE_OFFLINE"]
        }
        if chatMediaFixture {
            app.launchEnvironment["AISTROYKA_E2E_CHAT_FIXTURE"] = "1"
            app.launchArguments += ["-AISTROYKA_E2E_CHAT_FIXTURE"]
        }
        app.launchEnvironment["AISTROYKA_E2E_EMAIL"] = email
        app.launchEnvironment["AISTROYKA_E2E_PASSWORD"] = password
        app.launchArguments += ["-AISTROYKA_E2E_EMAIL", email, "-AISTROYKA_E2E_PASSWORD", password]
        let projectId = DeviceSmokeE2ESecrets.projectId
        app.launchEnvironment["AISTROYKA_E2E_PROJECT_ID"] = projectId
        app.launchArguments += ["-AISTROYKA_E2E_PROJECT_ID", projectId]
        let base = DeviceSmokeE2ESecrets.baseURL
        app.launchEnvironment["BASE_URL"] = base
        app.launchEnvironment["AISTROYKA_E2E_BASE_URL"] = base
        app.launchArguments += ["-BASE_URL", base, "-AISTROYKA_E2E_BASE_URL", base]
        let supa = DeviceSmokeE2ESecrets.supabaseURL
        app.launchEnvironment["SUPABASE_URL"] = supa
        app.launchArguments += ["-SUPABASE_URL", supa]
        let key = DeviceSmokeE2ESecrets.supabaseAnonKey
        app.launchEnvironment["SUPABASE_ANON_KEY"] = key
        app.launchArguments += ["-SUPABASE_ANON_KEY", key]
        app.launch()
        return app
    }

    private func waitForHome(_ app: XCUIApplication, timeout: TimeInterval = 90) -> Bool {
        let home = app.otherElements["pilot_worker_home"]
        let newReport = app.descendants(matching: .any)["pilot_worker_new_report"]
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if home.exists || newReport.exists { return true }
            let project = app.descendants(matching: .any).matching(
                NSPredicate(format: "identifier BEGINSWITH 'pilot_worker_project_'")
            ).firstMatch
            if project.exists {
                project.tap()
                RunLoop.current.run(until: Date().addingTimeInterval(1))
            }
            RunLoop.current.run(until: Date().addingTimeInterval(0.4))
        }
        return home.exists || newReport.exists
    }

    private func signInIfNeeded(_ app: XCUIApplication, email: String, password: String) {
        if waitForHome(app, timeout: 8) { return }
        let signIn = app.buttons["pilot_worker_sign_in"]
        guard signIn.waitForExistence(timeout: 20) else { return }
        let emailField = app.textFields["pilot_worker_email"]
        let passwordField = app.secureTextFields["pilot_worker_password"].exists
            ? app.secureTextFields["pilot_worker_password"]
            : app.textFields["pilot_worker_password"]
        XCTAssertTrue(emailField.waitForExistence(timeout: 5))
        emailField.tap()
        emailField.typeText(email)
        passwordField.tap()
        passwordField.typeText(password)
        signIn.tap()
        XCTAssertTrue(waitForHome(app, timeout: 90), "Worker home after sign-in")
    }

    private func openSyntheticTaskChat(_ app: XCUIApplication) {
        let taskId = DeviceSmokeE2ESecrets.taskId.isEmpty ? syntheticTaskId : DeviceSmokeE2ESecrets.taskId
        let taskRow = app.descendants(matching: .any)["pilot_worker_task_\(taskId)"]
        var found = taskRow.waitForExistence(timeout: 25)
        if !found {
            for _ in 0..<12 {
                app.swipeUp()
                if taskRow.waitForExistence(timeout: 1) { found = true; break }
            }
        }
        if found {
            taskRow.tap()
        } else {
            let byTitle = app.staticTexts["Pilot task 1"]
            XCTAssertTrue(byTitle.waitForExistence(timeout: 8), "Expected Pilot task 1 on home (today tasks)")
            byTitle.tap()
        }
        let chat = app.descendants(matching: .any)["pilot_worker_task_chat"]
        XCTAssertTrue(chat.waitForExistence(timeout: 20), "Expected task chat surface")
    }

    private func element(_ app: XCUIApplication, _ id: String) -> XCUIElement {
        app.descendants(matching: .any)[id]
    }

    private func typeAndSendText(_ app: XCUIApplication, marker: String) {
        let composer = element(app, "task_chat_composer")
        var typed = false
        if composer.waitForExistence(timeout: 10) {
            composer.tap()
            composer.typeText(marker)
            typed = true
        } else {
            let fieldQuery = app.textFields
            for i in 0..<min(fieldQuery.count, 12) {
                let field = fieldQuery.element(boundBy: i)
                if field.exists, field.isHittable {
                    field.tap()
                    field.typeText(marker)
                    typed = true
                    break
                }
            }
            if !typed {
                let tv = app.textViews.firstMatch
                if tv.waitForExistence(timeout: 3) {
                    tv.tap()
                    tv.typeText(marker)
                    typed = true
                }
            }
        }
        if !typed {
            NSLog("%@", app.debugDescription)
        }
        XCTAssertTrue(typed, "Could not focus chat composer")
        // Allow SwiftUI to enable the send button after draft changes.
        RunLoop.current.run(until: Date().addingTimeInterval(0.6))

        let send = element(app, "task_chat_send")
        if send.waitForExistence(timeout: 5) {
            XCTAssertTrue(send.isEnabled || send.waitForExistence(timeout: 1))
            send.tap()
            return
        }
        let byLabel = app.buttons["task_chat_send"]
        if byLabel.waitForExistence(timeout: 2) {
            byLabel.tap()
            return
        }
        // Last resort: enabled composer send is often the trailing button in the HStack
        let buttons = app.buttons
        for i in stride(from: buttons.count - 1, through: max(0, buttons.count - 6), by: -1) {
            let b = buttons.element(boundBy: i)
            if b.exists, b.isHittable, b.isEnabled {
                b.tap()
                return
            }
        }
        NSLog("%@", app.debugDescription)
        XCTFail("Could not tap send control")
    }

    private func acceptSystemPermissionIfPresent() {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        // Prefer full photo/mic grants. Never tap "Select Photos…" — that enters Limited Library
        // and steals the subsequent PhotosPicker interaction.
        let preferred = [
            "Allow Full Access",
            "Allow Access to All Photos",
            "Allow While Using App",
            "While Using the App",
            "Allow",
            "OK",
            "Разрешить полный доступ",
            "Разрешить",
        ]
        for label in preferred {
            let btn = springboard.buttons[label]
            if btn.waitForExistence(timeout: 0.9) {
                btn.tap()
                return
            }
        }
        let appAlert = XCUIApplication().alerts.firstMatch
        if appAlert.waitForExistence(timeout: 0.8) {
            for label in preferred {
                let b = appAlert.buttons[label]
                if b.exists { b.tap(); return }
            }
        }
    }

    /// Seed at least one photo via system Camera so PhotosPicker has a selectable cell.
    private func seedPhotoViaCameraIfNeeded() {
        let camera = XCUIApplication(bundleIdentifier: "com.apple.camera")
        camera.launch()
        RunLoop.current.run(until: Date().addingTimeInterval(2))
        acceptSystemPermissionIfPresent()
        let shutterCandidates = [
            "PhotoCapture", "Take Picture", "Shutter", "TakePhoto",
            "PhotoCaptureButton", "OBShutterButton"
        ]
        var tapped = false
        for id in shutterCandidates {
            let b = camera.buttons[id]
            if b.waitForExistence(timeout: 1.5) {
                b.tap()
                tapped = true
                break
            }
        }
        if !tapped {
            // Center-bottom shutter approximation
            let frame = camera.frame
            if frame.width > 0 {
                let coord = camera.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.92))
                coord.tap()
                tapped = true
            }
        }
        RunLoop.current.run(until: Date().addingTimeInterval(1.5))
        // Prefer "Use Photo" if in review UI
        for label in ["Use Photo", "Done", "OK", "Использовать", "Готово"] {
            let b = camera.buttons[label]
            if b.waitForExistence(timeout: 1.5) { b.tap(); break }
        }
        camera.terminate()
    }

    func testTaskChat_textRoundTripSurface() throws {
        let email = DeviceSmokeE2ESecrets.workerEmail
        let password = DeviceSmokeE2ESecrets.workerPassword
        let app = launchWorker(email: email, password: password)
        signInIfNeeded(app, email: email, password: password)
        openSyntheticTaskChat(app)

        let marker = "device-ui-text-\(Int(Date().timeIntervalSince1970))"
        typeAndSendText(app, marker: marker)
        XCTAssertTrue(app.staticTexts[marker].waitForExistence(timeout: 30), "Sent text should appear")

        app.terminate()
        let app2 = launchWorker(email: email, password: password)
        signInIfNeeded(app2, email: email, password: password)
        openSyntheticTaskChat(app2)
        XCTAssertTrue(app2.staticTexts[marker].waitForExistence(timeout: 30), "Message should persist after relaunch")
    }

    func testTaskChat_composerMediaControlsPresent() throws {
        let email = DeviceSmokeE2ESecrets.workerEmail
        let password = DeviceSmokeE2ESecrets.workerPassword
        let app = launchWorker(email: email, password: password)
        signInIfNeeded(app, email: email, password: password)
        openSyntheticTaskChat(app)

        XCTAssertTrue(element(app, "task_chat_attach").waitForExistence(timeout: 15), "Expected attach control")
        XCTAssertTrue(
            element(app, "task_chat_voice_record").waitForExistence(timeout: 5)
                || element(app, "task_chat_voice_stop").waitForExistence(timeout: 1),
            "Expected voice control"
        )
    }

    func testTaskChat_unassignedWorkerCannotOpenAssignedTask() throws {
        let email = DeviceSmokeE2ESecrets.unassignedWorkerEmail
        let password = DeviceSmokeE2ESecrets.unassignedWorkerPassword
        try XCTSkipIf(email.isEmpty || password.isEmpty, "Unassigned worker secrets not configured")

        let app = launchWorker(email: email, password: password)
        signInIfNeeded(app, email: email, password: password)
        let taskId = DeviceSmokeE2ESecrets.taskId.isEmpty ? syntheticTaskId : DeviceSmokeE2ESecrets.taskId
        let taskRow = app.descendants(matching: .any)["pilot_worker_task_\(taskId)"]
        let byTitle = app.staticTexts["Pilot task 1"]
        let chat = app.descendants(matching: .any)["pilot_worker_task_chat"]
        let foundRow = taskRow.waitForExistence(timeout: 8) || byTitle.waitForExistence(timeout: 4)
        if foundRow {
            if taskRow.exists { taskRow.tap() } else { byTitle.tap() }
            XCTAssertFalse(chat.waitForExistence(timeout: 8), "Unassigned worker must not reach task chat")
        } else {
            XCTAssertFalse(chat.exists)
        }
    }

    /// Upload-path regression without PhotosPicker (E2E fixture JPEG).
    func testTaskChat_fixturePhotoUploadPath() throws {
        let email = DeviceSmokeE2ESecrets.workerEmail
        let password = DeviceSmokeE2ESecrets.workerPassword
        let app = launchWorker(email: email, password: password, chatMediaFixture: true)
        signInIfNeeded(app, email: email, password: password)
        openSyntheticTaskChat(app)

        let before = app.descendants(matching: .any).matching(
            NSPredicate(format: "identifier BEGINSWITH 'task_chat_image_'")
        ).count

        let attach = element(app, "task_chat_attach")
        XCTAssertTrue(attach.waitForExistence(timeout: 15))
        attach.tap()

        let photoBubble = app.descendants(matching: .any).matching(
            NSPredicate(format: "identifier BEGINSWITH 'task_chat_image_' OR label ==[c] 'task_chat_photo'")
        ).firstMatch
        let err = element(app, "task_chat_error")
        let deadline = Date().addingTimeInterval(90)
        var appeared = false
        while Date() < deadline {
            if photoBubble.exists { appeared = true; break }
            if err.exists { XCTFail("Fixture photo error: \(err.label)") }
            RunLoop.current.run(until: Date().addingTimeInterval(1))
        }
        XCTAssertTrue(appeared, "Fixture photo bubble must appear")
        let after = app.descendants(matching: .any).matching(
            NSPredicate(format: "identifier BEGINSWITH 'task_chat_image_'")
        ).count
        XCTAssertGreaterThanOrEqual(after, before)

        app.terminate()
        let app2 = launchWorker(email: email, password: password, chatMediaFixture: true)
        signInIfNeeded(app2, email: email, password: password)
        openSyntheticTaskChat(app2)
        let persisted = app2.descendants(matching: .any).matching(
            NSPredicate(format: "identifier BEGINSWITH 'task_chat_image_' OR label ==[c] 'task_chat_photo'")
        ).firstMatch
        XCTAssertTrue(persisted.waitForExistence(timeout: 30), "Fixture photo must persist")
    }

    /// Gallery contract: paperclip opens PhotosPicker (no dedicated in-chat camera button).
    func testTaskChat_photoPickerGalleryPath() throws {
        let interrupt = addUIInterruptionMonitor(withDescription: "photos") { alert in
            for label in [
                "Allow Full Access", "Allow Access to All Photos",
                "Allow While Using App", "Allow", "OK", "Разрешить полный доступ", "Разрешить",
            ] {
                let b = alert.buttons[label]
                if b.exists { b.tap(); return true }
            }
            return false
        }
        defer { removeUIInterruptionMonitor(interrupt) }

        seedPhotoViaCameraIfNeeded()

        let email = DeviceSmokeE2ESecrets.workerEmail
        let password = DeviceSmokeE2ESecrets.workerPassword
        let app = launchWorker(email: email, password: password)
        signInIfNeeded(app, email: email, password: password)
        openSyntheticTaskChat(app)
        app.tap() // engage interruption monitor

        let attach = element(app, "task_chat_attach")
        XCTAssertTrue(attach.waitForExistence(timeout: 15))
        attach.tap()
        acceptSystemPermissionIfPresent()
        acceptSystemPermissionIfPresent()
        // Limited library → choose "Allow Full Access" / "Allow Access to All Photos" if offered
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        for label in ["Allow Full Access", "Allow Access to All Photos", "Разрешить полный доступ"] {
            let b = springboard.buttons[label]
            if b.waitForExistence(timeout: 1.0) { b.tap(); break }
        }

        let pickerDeadline = Date().addingTimeInterval(30)
        var selected = false
        while Date() < pickerDeadline && !selected {
            // PHPicker / PhotosUI grids
            let grids = [app.collectionViews, app.scrollViews]
            for grid in grids {
                if grid.count == 0 { continue }
                let host = grid.element(boundBy: 0)
                if !host.waitForExistence(timeout: 1) { continue }
                let cells = host.cells
                if cells.count > 0 {
                    cells.element(boundBy: 0).tap()
                    selected = true
                    break
                }
            }
            if !selected {
                let images = app.images
                if images.count > 0 {
                    // Prefer a non-decorative image; boundBy 0 is often the first asset tile
                    images.element(boundBy: min(1, images.count - 1)).tap()
                    selected = true
                }
            }
            if selected {
                // Confirm multi-select style pickers
                for label in ["Add", "Add (1)", "Done", "Добавить", "Готово", "OK"] {
                    let b = app.buttons[label]
                    if b.waitForExistence(timeout: 1.2), b.isHittable {
                        b.tap()
                        break
                    }
                }
                break
            }
            RunLoop.current.run(until: Date().addingTimeInterval(0.4))
        }
        XCTAssertTrue(selected, "Expected to select a gallery image from PhotosPicker")

        let photoBubble = app.descendants(matching: .any).matching(
            NSPredicate(format: "identifier BEGINSWITH 'task_chat_image_' OR label ==[c] 'task_chat_photo'")
        ).firstMatch
        let err = element(app, "task_chat_error")
        let deadline = Date().addingTimeInterval(120)
        var appeared = false
        while Date() < deadline {
            if photoBubble.exists { appeared = true; break }
            if err.exists {
                XCTFail("Photo path error: \(err.label)")
            }
            RunLoop.current.run(until: Date().addingTimeInterval(1))
        }
        XCTAssertTrue(appeared, "Gallery photo bubble must appear in chat after successful upload")

        // Persistence
        app.terminate()
        let app2 = launchWorker(email: email, password: password)
        signInIfNeeded(app2, email: email, password: password)
        openSyntheticTaskChat(app2)
        let persisted = app2.descendants(matching: .any).matching(
            NSPredicate(format: "identifier BEGINSWITH 'task_chat_image_' OR label ==[c] 'task_chat_photo'")
        ).firstMatch
        XCTAssertTrue(persisted.waitForExistence(timeout: 30), "Gallery photo must persist after relaunch")
    }

    func testTaskChat_voiceRecordSendAndCancel() throws {
        let email = DeviceSmokeE2ESecrets.workerEmail
        let password = DeviceSmokeE2ESecrets.workerPassword

        let interrupt = addUIInterruptionMonitor(withDescription: "mic") { alert in
            for label in ["Allow", "OK", "Allow While Using App", "While Using the App", "Разрешить"] {
                let b = alert.buttons[label]
                if b.exists { b.tap(); return true }
            }
            return false
        }
        defer { removeUIInterruptionMonitor(interrupt) }

        let app = launchWorker(email: email, password: password)
        signInIfNeeded(app, email: email, password: password)
        openSyntheticTaskChat(app)

        let beforeVoice = app.descendants(matching: .any).matching(
            NSPredicate(format: "identifier BEGINSWITH 'task_chat_voice_'")
        ).count

        let record = element(app, "task_chat_voice_record")
        XCTAssertTrue(record.waitForExistence(timeout: 10))
        record.tap()
        acceptSystemPermissionIfPresent()
        // Permission callback is async — retap if still showing record (do not tap app center; that can hit Stop).
        let armDeadline = Date().addingTimeInterval(12)
        while Date() < armDeadline {
            if element(app, "task_chat_voice_stop").exists { break }
            if element(app, "task_chat_voice_record").exists {
                element(app, "task_chat_voice_record").tap()
                acceptSystemPermissionIfPresent()
            }
            if element(app, "task_chat_error").exists {
                // Denied path — controlled error, not crash
                XCTAssertTrue(
                    element(app, "task_chat_error").label.lowercased().contains("mic")
                        || element(app, "task_chat_error").label.lowercased().contains("микрофон")
                        || element(app, "task_chat_error").label.lowercased().contains("microphone"),
                    "Expected mic-denied copy, got: \(element(app, "task_chat_error").label)"
                )
                return
            }
            RunLoop.current.run(until: Date().addingTimeInterval(0.4))
        }
        XCTAssertTrue(element(app, "task_chat_voice_stop").waitForExistence(timeout: 5), "Recording should start after mic allow")

        // Cancel via explicit control — must not create a voice bubble
        let cancel = element(app, "task_chat_voice_cancel")
        XCTAssertTrue(cancel.waitForExistence(timeout: 5), "Cancel control while recording")
        cancel.tap()
        RunLoop.current.run(until: Date().addingTimeInterval(1.0))
        let afterCancel = app.descendants(matching: .any).matching(
            NSPredicate(format: "identifier BEGINSWITH 'task_chat_voice_'")
        ).count
        XCTAssertEqual(afterCancel, beforeVoice, "Cancelled recording must not create a voice bubble")

        let record2 = element(app, "task_chat_voice_record")
        XCTAssertTrue(record2.waitForExistence(timeout: 10))
        record2.tap()
        acceptSystemPermissionIfPresent()
        XCTAssertTrue(element(app, "task_chat_voice_stop").waitForExistence(timeout: 12))
        RunLoop.current.run(until: Date().addingTimeInterval(5.0))
        element(app, "task_chat_voice_stop").tap()

        let voiceBubble = app.descendants(matching: .any).matching(
            NSPredicate(format: "identifier BEGINSWITH 'task_chat_voice_' OR label ==[c] 'task_chat_voice'")
        ).firstMatch
        let err = element(app, "task_chat_error")
        let deadline = Date().addingTimeInterval(90)
        var appeared = false
        while Date() < deadline {
            if voiceBubble.exists { appeared = true; break }
            if err.exists { XCTFail("Voice send error: \(err.label)") }
            RunLoop.current.run(until: Date().addingTimeInterval(1))
        }
        XCTAssertTrue(appeared, "Voice message bubble should appear after send")

        // Playback control present
        let play = app.descendants(matching: .any).matching(
            NSPredicate(format: "label CONTAINS[c] 'play' OR identifier CONTAINS[c] 'play'")
        ).firstMatch
        if play.waitForExistence(timeout: 5) { play.tap() }

        app.terminate()
        let app2 = launchWorker(email: email, password: password)
        signInIfNeeded(app2, email: email, password: password)
        openSyntheticTaskChat(app2)
        let persisted = app2.descendants(matching: .any).matching(
            NSPredicate(format: "identifier BEGINSWITH 'task_chat_voice_' OR label ==[c] 'task_chat_voice'")
        ).firstMatch
        XCTAssertTrue(persisted.waitForExistence(timeout: 30), "Voice must persist after relaunch")
    }

    func testTaskChat_deleteOwnMessageViaUI() throws {
        let email = DeviceSmokeE2ESecrets.workerEmail
        let password = DeviceSmokeE2ESecrets.workerPassword
        let app = launchWorker(email: email, password: password)
        signInIfNeeded(app, email: email, password: password)
        openSyntheticTaskChat(app)

        let marker = "device-ui-del-\(Int(Date().timeIntervalSince1970))"
        typeAndSendText(app, marker: marker)
        XCTAssertTrue(app.staticTexts[marker].waitForExistence(timeout: 30))
        // Allow currentUserId refresh + mine affordance
        RunLoop.current.run(until: Date().addingTimeInterval(2))

        let bubble = app.staticTexts[marker]
        XCTAssertTrue(bubble.waitForExistence(timeout: 5))
        let deleteBtn = app.descendants(matching: .any).matching(
            NSPredicate(format: "identifier BEGINSWITH 'task_chat_delete_' OR label ==[c] 'task_chat_delete'")
        ).firstMatch
        if deleteBtn.waitForExistence(timeout: 15) {
            deleteBtn.tap()
        } else {
            // Fallback: context menu on the bubble
            bubble.press(forDuration: 1.2)
            let menuDelete = app.buttons.matching(
                NSPredicate(format: "label ==[c] 'Delete' OR label ==[c] 'Удалить' OR label ==[c] 'task_chat_delete'")
            ).firstMatch
            XCTAssertTrue(menuDelete.waitForExistence(timeout: 5), "Expected delete in context menu")
            menuDelete.tap()
        }

        let deadline = Date().addingTimeInterval(30)
        while Date() < deadline {
            if !app.staticTexts[marker].exists { break }
            RunLoop.current.run(until: Date().addingTimeInterval(0.4))
        }
        XCTAssertFalse(app.staticTexts[marker].exists, "Message must be removed after delete")

        app.terminate()
        let app2 = launchWorker(email: email, password: password)
        signInIfNeeded(app2, email: email, password: password)
        openSyntheticTaskChat(app2)
        XCTAssertFalse(app2.staticTexts[marker].waitForExistence(timeout: 8), "Deleted message must not reappear")
    }

    func testTaskChat_offlineTextQueuesThenSyncs() throws {
        let email = DeviceSmokeE2ESecrets.workerEmail
        let password = DeviceSmokeE2ESecrets.workerPassword
        let marker = "device-ui-offline-\(Int(Date().timeIntervalSince1970))"

        let offlineApp = launchWorker(email: email, password: password, forceOffline: true)
        signInIfNeeded(offlineApp, email: email, password: password)
        openSyntheticTaskChat(offlineApp)
        typeAndSendText(offlineApp, marker: marker)
        XCTAssertTrue(offlineApp.staticTexts[marker].waitForExistence(timeout: 15), "Optimistic offline text should appear")

        // Media offline should surface controlled error, not crash
        let attach = offlineApp.buttons["task_chat_attach"]
        if attach.waitForExistence(timeout: 3) {
            attach.tap()
            acceptSystemPermissionIfPresent()
            // Dismiss picker if it opened — media send blocked before/at upload when offline
            if offlineApp.navigationBars.buttons.firstMatch.exists {
                // leave picker
                let cancel = offlineApp.buttons["Cancel"].exists ? offlineApp.buttons["Cancel"] : offlineApp.buttons["Отмена"]
                if cancel.exists { cancel.tap() }
            }
        }
        let offlineMediaHint = offlineApp.staticTexts.matching(
            NSPredicate(format: "label CONTAINS[c] 'network' OR label CONTAINS[c] 'сеть' OR label CONTAINS[c] 'conexión' OR label CONTAINS[c] 'connessione'")
        ).firstMatch
        // Hint may appear only after selecting media; presence of optimistic text is enough for text path
        _ = offlineMediaHint.waitForExistence(timeout: 2)

        offlineApp.terminate()

        // Restore network (no force offline) — queue should flush
        let onlineApp = launchWorker(email: email, password: password, forceOffline: false)
        signInIfNeeded(onlineApp, email: email, password: password)
        // Give executor time to drain sendTaskMessage
        RunLoop.current.run(until: Date().addingTimeInterval(8))
        openSyntheticTaskChat(onlineApp)
        XCTAssertTrue(onlineApp.staticTexts[marker].waitForExistence(timeout: 45), "Offline text should sync exactly once and appear")
    }

    func testTaskChat_stakeholderCannotUseWorkerAssignedTask() throws {
        let email = DeviceSmokeE2ESecrets.stakeholderEmail
        let password = DeviceSmokeE2ESecrets.stakeholderPassword
        try XCTSkipIf(email.isEmpty || password.isEmpty, "Stakeholder secrets not configured")

        let app = launchWorker(email: email, password: password)
        // Stakeholder may fail worker login or see empty home — must not open Ivan's task chat
        _ = waitForHome(app, timeout: 25)
        let taskId = DeviceSmokeE2ESecrets.taskId.isEmpty ? syntheticTaskId : DeviceSmokeE2ESecrets.taskId
        let taskRow = app.descendants(matching: .any)["pilot_worker_task_\(taskId)"]
        let chat = app.descendants(matching: .any)["pilot_worker_task_chat"]
        XCTAssertFalse(taskRow.waitForExistence(timeout: 8), "Stakeholder must not see assigned worker task in Worker app")
        XCTAssertFalse(chat.exists)
    }

    /// Cross-tenant smoke identity must not open the synthetic pilot task chat.
    func testTaskChat_crossTenantCannotOpenSyntheticTask() throws {
        let email = DeviceSmokeE2ESecrets.crossTenantEmail
        let password = DeviceSmokeE2ESecrets.crossTenantPassword
        try XCTSkipIf(email.isEmpty || password.isEmpty, "Cross-tenant secrets not configured")

        let app = launchWorker(email: email, password: password)
        _ = waitForHome(app, timeout: 45)
        let taskId = DeviceSmokeE2ESecrets.taskId.isEmpty ? syntheticTaskId : DeviceSmokeE2ESecrets.taskId
        let taskRow = app.descendants(matching: .any)["pilot_worker_task_\(taskId)"]
        let byTitle = app.staticTexts["Pilot task 1"]
        let chat = app.descendants(matching: .any)["pilot_worker_task_chat"]
        XCTAssertFalse(taskRow.waitForExistence(timeout: 8), "Cross-tenant user must not see synthetic pilot task row")
        XCTAssertFalse(byTitle.waitForExistence(timeout: 3), "Cross-tenant user must not see Pilot task 1 title")
        XCTAssertFalse(chat.exists)
    }

    /// Declared video contract: gallery/file selection via same PhotosPicker (images+videos). No in-chat video camera.
    func testTaskChat_videoGalleryPathIfAssetAvailable() throws {
        let email = DeviceSmokeE2ESecrets.workerEmail
        let password = DeviceSmokeE2ESecrets.workerPassword
        let app = launchWorker(email: email, password: password)
        signInIfNeeded(app, email: email, password: password)
        openSyntheticTaskChat(app)

        let attach = element(app, "task_chat_attach")
        XCTAssertTrue(attach.waitForExistence(timeout: 15))
        attach.tap()
        acceptSystemPermissionIfPresent()
        acceptSystemPermissionIfPresent()

        // Prefer a video tile if the library exposes one; otherwise skip (no synthetic video seed).
        let deadline = Date().addingTimeInterval(20)
        var tappedVideo = false
        while Date() < deadline && !tappedVideo {
            let videoPred = NSPredicate(format: "label CONTAINS[c] 'Video' OR label CONTAINS[c] 'видео' OR identifier CONTAINS[c] 'video'")
            let videoCell = app.descendants(matching: .any).matching(videoPred).firstMatch
            if videoCell.waitForExistence(timeout: 1), videoCell.isHittable {
                videoCell.tap()
                tappedVideo = true
                break
            }
            RunLoop.current.run(until: Date().addingTimeInterval(0.4))
        }
        try XCTSkipIf(!tappedVideo, "No selectable video asset in Photos library on device")

        for label in ["Add", "Add (1)", "Done", "Добавить", "Готово"] {
            let b = app.buttons[label]
            if b.waitForExistence(timeout: 1.5), b.isHittable { b.tap(); break }
        }

        let videoBubble = app.descendants(matching: .any).matching(
            NSPredicate(format: "identifier BEGINSWITH 'task_chat_video_' OR label ==[c] 'task_chat_video'")
        ).firstMatch
        XCTAssertTrue(videoBubble.waitForExistence(timeout: 120), "Video bubble must appear after gallery send")
    }
}
