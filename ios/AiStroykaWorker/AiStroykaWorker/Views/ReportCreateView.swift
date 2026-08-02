//
//  ReportCreateView.swift
//  AiStroykaWorker
//
//  Phase 7.4 — Full report pipeline via operation queue (no direct UploadManager critical path).
//

import SwiftUI
import UIKit
import Shared

struct ReportCreateView: View {
    let projectId: String
    let dayId: String?
    var draftReportId: String? = nil
    /// Server task UUID when report is for a specific task; sent as task_id to report/create and report/submit.
    var taskId: String? = nil
    var taskTitle: String? = nil
    @StateObject private var opStore = OperationQueueStore.shared
    @State private var draftId: String?
    @State private var reportId: String?
    @State private var errorMessage: String?
    @State private var beforeImage: UIImage?
    @State private var afterImage: UIImage?
    @State private var beforeItemId: String?
    @State private var afterItemId: String?
    @State private var showImagePickerBefore = false
    @State private var showImagePickerAfter = false
    @State private var showCameraBefore = false
    @State private var showCameraAfter = false
    @State private var showImageSourceBefore = false
    @State private var showImageSourceAfter = false
    @State private var submitEnqueued = false
    @State private var submitted = false
    @State private var workerNoteText = ""

    private var store: AppStateStoreManager { AppStateStoreManager.shared }

    private var canSubmitReport: Bool {
        guard let beforeId = beforeItemId, let afterId = afterItemId else { return false }
        let beforeDone = opStore.operation(id: attachMediaOpId(photoItemId: beforeId))?.state == .succeeded
        let afterDone = opStore.operation(id: attachMediaOpId(photoItemId: afterId))?.state == .succeeded
        return beforeDone && afterDone
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if let title = taskTitle, !title.isEmpty {
                Text(String(format: NSLocalizedString("worker_report_for_task_fmt", comment: ""), title))
                    .font(.subheadline)
                    .foregroundStyle(BrandTokens.textSecondary)
            }
            if draftId == nil {
                Button(NSLocalizedString("worker_report_create", comment: "")) { enqueueCreateReport() }
                    .accessibilityIdentifier("pilot_worker_report_create")
            } else if let did = draftId {
                Text(String(format: NSLocalizedString("worker_report_draft_fmt", comment: ""), String(did.prefix(8))))
                    .font(.caption)
                    .accessibilityIdentifier("pilot_worker_report_draft_ready")
                if let rid = reportId {
                    Text(String(format: NSLocalizedString("worker_report_server_id", comment: ""), String(rid.prefix(8))))
                        .font(.caption)
                        .foregroundStyle(BrandTokens.textSecondary)
                }
                Group {
                    photoPickRow(
                        label: NSLocalizedString("worker_photo_before", comment: ""),
                        image: beforeImage,
                        showSource: $showImageSourceBefore,
                        itemId: beforeItemId,
                        photoLabel: NSLocalizedString("worker_photo_before_short", comment: ""),
                        pickAccessibilityId: "pilot_worker_photo_before_pick",
                        retryAccessibilityId: "pilot_worker_photo_before_retry"
                    )
                    photoPickRow(
                        label: NSLocalizedString("worker_photo_after", comment: ""),
                        image: afterImage,
                        showSource: $showImageSourceAfter,
                        itemId: afterItemId,
                        photoLabel: NSLocalizedString("worker_photo_after_short", comment: ""),
                        pickAccessibilityId: "pilot_worker_photo_after_pick",
                        retryAccessibilityId: "pilot_worker_photo_after_retry"
                    )
                }
                if canSubmitReport && !submitted {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(NSLocalizedString("worker_report_note_label", comment: ""))
                            .font(.caption)
                            .foregroundStyle(BrandTokens.textSecondary)
                        TextField(NSLocalizedString("worker_report_note_placeholder", comment: ""), text: $workerNoteText, axis: .vertical)
                            .lineLimit(3...6)
                            .textFieldStyle(.roundedBorder)
                            .accessibilityIdentifier("pilot_worker_report_note")
                    }
                    Button(NSLocalizedString("worker_submit_report", comment: "")) { enqueueSubmitReport() }
                        .disabled(submitEnqueued && !submitFailed)
                        .accessibilityIdentifier("pilot_worker_submit_report")
                }
            }
            if let err = errorMessage { Text(err).foregroundStyle(BrandTokens.stateError).font(.caption) }
            if submitEnqueued && !submitted && !submitFailed {
                Text(NSLocalizedString("worker_submit_queued", comment: "")).foregroundStyle(BrandTokens.stateSuccess)
            }
            if submitted {
                Text(NSLocalizedString("worker_submitted", comment: ""))
                    .foregroundStyle(BrandTokens.stateSuccess)
                    .accessibilityIdentifier("pilot_worker_report_submitted")
            }
            #if DEBUG
            if UITestLaunchHooks.isE2EEnabled {
                let pending = opStore.operations.filter { $0.state == .queued || $0.state == .running }.count
                Text("queue_pending=\(pending)")
                    .font(.caption2)
                    .foregroundStyle(BrandTokens.textSecondary)
                    .accessibilityIdentifier("pilot_worker_queue_pending_count")
                if OperationQueueExecutor.shared.isPaused {
                    Text("queue_paused")
                        .font(.caption2)
                        .accessibilityIdentifier("pilot_worker_queue_paused")
                    Button("Resume queue") {
                        OperationQueueExecutor.shared.resumeQueue()
                    }
                    .accessibilityIdentifier("pilot_worker_queue_resume")
                }
                if let failed = opStore.operations.first(where: { $0.state == .failed_permanent }) {
                    Text("op_failed=\(failed.type.rawValue):\(failed.lastErrorMessage ?? failed.lastErrorCode ?? "?")")
                        .font(.caption2)
                        .foregroundStyle(BrandTokens.stateError)
                        .accessibilityIdentifier("pilot_worker_queue_failed_op")
                }
                if UITestLaunchHooks.e2eInjectSyntheticMedia, draftId != nil, beforeItemId == nil || afterItemId == nil {
                    Button("Inject E2E media") {
                        injectE2ESyntheticMediaIfNeeded()
                    }
                    .accessibilityIdentifier("pilot_worker_e2e_inject_media")
                }
            }
            #endif
        }
        .padding()
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("pilot_worker_report_compose")
        .navigationTitle(NSLocalizedString("worker_new_report", comment: ""))
        .brandScrollChrome()
        .navigationBarTitleDisplayMode(.inline)
        .confirmationDialog(NSLocalizedString("worker_photo_dialog_before", comment: ""), isPresented: $showImageSourceBefore) {
            Button(NSLocalizedString("worker_take_photo", comment: "")) { showCameraBefore = true }
            Button(NSLocalizedString("worker_choose_library", comment: "")) { showImagePickerBefore = true }
            Button(NSLocalizedString("worker_cancel", comment: ""), role: .cancel) {}
        }
        .confirmationDialog(NSLocalizedString("worker_photo_dialog_after", comment: ""), isPresented: $showImageSourceAfter) {
            Button(NSLocalizedString("worker_take_photo", comment: "")) { showCameraAfter = true }
            Button(NSLocalizedString("worker_choose_library", comment: "")) { showImagePickerAfter = true }
            Button(NSLocalizedString("worker_cancel", comment: ""), role: .cancel) {}
        }
        .sheet(isPresented: $showImagePickerBefore) { ImagePicker(image: $beforeImage) }
        .sheet(isPresented: $showImagePickerAfter) { ImagePicker(image: $afterImage) }
        .fullScreenCover(isPresented: $showCameraBefore) { CameraPicker(image: $beforeImage) }
        .fullScreenCover(isPresented: $showCameraAfter) { CameraPicker(image: $afterImage) }
        .onAppear {
            if let draft = draftReportId {
                draftId = draft
                reportId = opStore.operation(id: createReportOpId(draftId: draft))?.resultReportId
                store.save { $0.draftReportId = draft }
            } else if UITestLaunchHooks.e2ePreserveQueue, draftId == nil {
                restoreDraftFromDurableQueueIfNeeded()
            }
            if let note = UITestLaunchHooks.e2eWorkerNote, workerNoteText.isEmpty {
                workerNoteText = note
            }
            if let tid = taskId {
                store.save { $0.draftTaskId = tid }
            }
            #if DEBUG
            if UITestLaunchHooks.e2ePauseQueue {
                OperationQueueExecutor.shared.pauseQueue()
            } else {
                OperationQueueExecutor.shared.runLoop()
            }
            if UITestLaunchHooks.e2eInjectSyntheticMedia, draftId != nil {
                injectE2ESyntheticMediaIfNeeded()
            }
            #endif
        }
        .onChange(of: opStore.operations) { _ in
            if let did = draftId {
                reportId = opStore.operation(id: createReportOpId(draftId: did))?.resultReportId
                let submitOp = opStore.operation(id: submitReportOpId(draftId: did))
                if submitOp?.state == .succeeded {
                    submitted = true
                    submitEnqueued = false
                    errorMessage = nil
                    store.save { $0.draftTaskId = nil }
                } else if submitOp?.state == .failed_permanent {
                    errorMessage = localizedOpFailure(submitOp)
                    submitEnqueued = false
                }
            }
        }
        .onChange(of: beforeImage) { new in
            guard let img = new, draftId != nil, beforeItemId == nil else { return }
            addPhoto(purpose: "report_before", image: img) { beforeItemId = $0 }
        }
        .onChange(of: afterImage) { new in
            guard let img = new, draftId != nil, afterItemId == nil else { return }
            addPhoto(purpose: "report_after", image: img) { afterItemId = $0 }
        }
    }

    private var submitFailed: Bool {
        guard let did = draftId else { return false }
        return opStore.operation(id: submitReportOpId(draftId: did))?.state == .failed_permanent
    }

    private func localizedOpFailure(_ op: QueuedOperation?) -> String {
        guard let op else { return NSLocalizedString("worker_error_generic", comment: "") }
        if op.lastErrorCode == "proof_required" {
            return NSLocalizedString("worker_error_proof_required", comment: "")
        }
        if op.lastErrorCode == "max_attempts" {
            return NSLocalizedString("worker_error_max_attempts", comment: "")
        }
        if let msg = op.lastErrorMessage, !msg.isEmpty { return msg }
        return NSLocalizedString("worker_error_generic", comment: "")
    }

    private func photoPickRow(
        label: String,
        image: UIImage?,
        showSource: Binding<Bool>,
        itemId: String?,
        photoLabel: String,
        pickAccessibilityId: String,
        retryAccessibilityId: String
    ) -> some View {
        HStack(alignment: .top, spacing: 10) {
            if let img = image {
                Image(uiImage: img)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 56, height: 56)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
            VStack(alignment: .leading, spacing: 6) {
                Button(label) { showSource.wrappedValue = true }
                    .accessibilityIdentifier(pickAccessibilityId)
                if let id = itemId {
                    photoStatusRow(photoItemId: id, label: photoLabel, retryAccessibilityId: retryAccessibilityId)
                }
            }
        }
    }

    private func photoStatusRow(photoItemId: String, label: String, retryAccessibilityId: String) -> some View {
        let attachOp = opStore.operation(id: attachMediaOpId(photoItemId: photoItemId))
        let state = attachOp?.state ?? .queued
        return HStack(spacing: 4) {
            Text("\(label): \(stateLabel(state))").font(.caption2)
            if state == .failed_permanent || (state == .queued && (attachOp?.attemptCount ?? 0) > 0) {
                Button(NSLocalizedString("worker_retry", comment: "")) { retryPhotoChain(photoItemId: photoItemId) }
                    .accessibilityIdentifier(retryAccessibilityId)
            }
        }
    }

    private func stateLabel(_ state: OperationState) -> String {
        switch state {
        case .queued: return NSLocalizedString("worker_op_queued", comment: "")
        case .running: return NSLocalizedString("worker_op_running", comment: "")
        case .succeeded: return NSLocalizedString("worker_op_done", comment: "")
        case .failed_permanent: return NSLocalizedString("worker_op_failed", comment: "")
        }
    }

    private func createReportOpId(draftId: String) -> String { "createReport-\(draftId)" }
    private func createSessionOpId(photoItemId: String) -> String { "createSession-\(photoItemId)" }
    private func uploadBinaryOpId(photoItemId: String) -> String { "uploadBinary-\(photoItemId)" }
    private func finalizeOpId(photoItemId: String) -> String { "finalize-\(photoItemId)" }
    private func attachMediaOpId(photoItemId: String) -> String { "attachMedia-\(photoItemId)" }
    private func submitReportOpId(draftId: String) -> String { "submitReport-\(draftId)" }

    private func enqueueCreateReport() {
        errorMessage = nil
        let did = UUID().uuidString
        draftId = did
        let key = store.state.draftReportCreateKey[did] ?? DeviceContext.newIdempotencyKey()
        store.save { $0.draftReportCreateKey[did] = key; $0.draftReportId = did }
        // day_id is a uuid FK on the server; send it only when we hold the server
        // worker_day id (legacy local date keys would fail report creation).
        let day = dayId.flatMap { $0.count == 36 && $0.contains("-") ? $0 : nil }
        let taskIdForCreate = taskId ?? store.state.draftTaskId
        let now = ISO8601DateFormatter().string(from: Date())
        let op = QueuedOperation(
            id: createReportOpId(draftId: did),
            type: .createReport,
            payload: OperationPayload(dayId: day, taskId: taskIdForCreate, reportId: nil, purpose: nil, photoItemId: nil, sessionId: nil, uploadPath: nil, objectPath: nil, mimeType: nil, sizeBytes: nil, imageDataBase64: nil, cursor: nil),
            idempotencyKey: key,
            dependsOn: [],
            state: .queued,
            attemptCount: 0,
            nextAttemptAt: nil,
            lastErrorCode: nil,
            lastErrorMessage: nil,
            createdAt: now,
            updatedAt: now,
            resultReportId: nil,
            resultSessionId: nil,
            resultUploadPath: nil
        )
        opStore.add(op)
        OperationQueueExecutor.shared.runLoop()
    }

    private func addPhoto(purpose: String, image: UIImage, setItemId: @escaping (String) -> Void) {
        guard let did = draftId,
              let jpeg = image.jpegData(compressionQuality: 0.85) else { return }
        let photoId = UUID().uuidString
        let base64 = jpeg.base64EncodedString()
        let keyCreate = DeviceContext.newIdempotencyKey()
        let keyUpload = DeviceContext.newIdempotencyKey()
        let keyFinalize = DeviceContext.newIdempotencyKey()
        let keyAddMedia = DeviceContext.newIdempotencyKey()
        let pending = PendingUploadItem(
            id: photoId,
            purpose: purpose,
            reportId: "",
            sessionId: nil,
            uploadPath: nil,
            objectPath: nil,
            phase: "queued",
            lastError: nil,
            idempotencyKeyCreate: keyCreate,
            idempotencyKeyFinalize: keyFinalize,
            idempotencyKeyAddMedia: keyAddMedia,
            createdAt: ISO8601DateFormatter().string(from: Date()),
            imageDataBase64: base64
        )
        store.save { $0.pendingUploads.append(pending) }
        setItemId(photoId)

        let createReportId = createReportOpId(draftId: did)
        let now = ISO8601DateFormatter().string(from: Date())
        func mkPayload(dayId: String? = nil, taskId: String? = nil, reportId: String? = nil, purpose: String? = nil, photoItemId: String? = nil, sessionId: String? = nil, uploadPath: String? = nil, objectPath: String? = nil, mimeType: String? = nil, sizeBytes: Int? = nil, imageDataBase64: String? = nil, cursor: Int? = nil, workerNote: String? = nil) -> OperationPayload {
            OperationPayload(dayId: dayId, taskId: taskId, reportId: reportId, purpose: purpose, photoItemId: photoItemId, sessionId: sessionId, uploadPath: uploadPath, objectPath: objectPath, mimeType: mimeType, sizeBytes: sizeBytes, imageDataBase64: imageDataBase64, cursor: cursor, workerNote: workerNote)
        }

        let opCreateSession = QueuedOperation(id: createSessionOpId(photoItemId: photoId), type: .createUploadSession, payload: mkPayload(purpose: purpose), idempotencyKey: keyCreate, dependsOn: [createReportId], state: .queued, attemptCount: 0, nextAttemptAt: nil, lastErrorCode: nil, lastErrorMessage: nil, createdAt: now, updatedAt: now, resultReportId: nil, resultSessionId: nil, resultUploadPath: nil)
        let opUpload = QueuedOperation(id: uploadBinaryOpId(photoItemId: photoId), type: .uploadBinary, payload: mkPayload(reportId: nil, photoItemId: photoId, imageDataBase64: base64), idempotencyKey: keyUpload, dependsOn: [createSessionOpId(photoItemId: photoId)], state: .queued, attemptCount: 0, nextAttemptAt: nil, lastErrorCode: nil, lastErrorMessage: nil, createdAt: now, updatedAt: now, resultReportId: nil, resultSessionId: nil, resultUploadPath: nil)
        let opFinalize = QueuedOperation(id: finalizeOpId(photoItemId: photoId), type: .finalizeSession, payload: mkPayload(mimeType: "image/jpeg", sizeBytes: jpeg.count), idempotencyKey: keyFinalize, dependsOn: [uploadBinaryOpId(photoItemId: photoId), createSessionOpId(photoItemId: photoId)], state: .queued, attemptCount: 0, nextAttemptAt: nil, lastErrorCode: nil, lastErrorMessage: nil, createdAt: now, updatedAt: now, resultReportId: nil, resultSessionId: nil, resultUploadPath: nil)
        let opAttach = QueuedOperation(id: attachMediaOpId(photoItemId: photoId), type: .attachMedia, payload: mkPayload(), idempotencyKey: keyAddMedia, dependsOn: [finalizeOpId(photoItemId: photoId), createReportId, createSessionOpId(photoItemId: photoId)], state: .queued, attemptCount: 0, nextAttemptAt: nil, lastErrorCode: nil, lastErrorMessage: nil, createdAt: now, updatedAt: now, resultReportId: nil, resultSessionId: nil, resultUploadPath: nil)

        opStore.add(opCreateSession)
        opStore.add(opUpload)
        opStore.add(opFinalize)
        opStore.add(opAttach)
        OperationQueueExecutor.shared.runLoop()
    }

    private func retryPhotoChain(photoItemId: String) {
        opStore.update(id: createSessionOpId(photoItemId: photoItemId)) {
            $0.state = .queued
            $0.nextAttemptAt = nil
            $0.attemptCount = 0
            $0.lastErrorCode = nil
            $0.lastErrorMessage = nil
        }
        opStore.update(id: uploadBinaryOpId(photoItemId: photoItemId)) {
            $0.state = .queued
            $0.nextAttemptAt = nil
            $0.attemptCount = 0
            $0.lastErrorCode = nil
            $0.lastErrorMessage = nil
        }
        opStore.update(id: finalizeOpId(photoItemId: photoItemId)) {
            $0.state = .queued
            $0.nextAttemptAt = nil
            $0.attemptCount = 0
            $0.lastErrorCode = nil
            $0.lastErrorMessage = nil
        }
        opStore.update(id: attachMediaOpId(photoItemId: photoItemId)) {
            $0.state = .queued
            $0.nextAttemptAt = nil
            $0.attemptCount = 0
            $0.lastErrorCode = nil
            $0.lastErrorMessage = nil
        }
        OperationQueueExecutor.shared.runLoop()
    }

    private func enqueueSubmitReport() {
        guard let did = draftId, let beforeId = beforeItemId, let afterId = afterItemId else { return }
        errorMessage = nil
        let taskIdForSubmit = taskId ?? store.state.draftTaskId
        let key = DeviceContext.newIdempotencyKey()
        let now = ISO8601DateFormatter().string(from: Date())
        let trimmedNote = workerNoteText.trimmingCharacters(in: .whitespacesAndNewlines)
        let noteForSubmit: String? = trimmedNote.isEmpty ? nil : String(trimmedNote.prefix(2000))
        let op = QueuedOperation(
            id: submitReportOpId(draftId: did),
            type: .submitReport,
            payload: OperationPayload(
                dayId: nil,
                taskId: taskIdForSubmit,
                reportId: nil,
                purpose: nil,
                photoItemId: nil,
                sessionId: nil,
                uploadPath: nil,
                objectPath: nil,
                mimeType: nil,
                sizeBytes: nil,
                imageDataBase64: nil,
                cursor: nil,
                workerNote: noteForSubmit
            ),
            idempotencyKey: key,
            dependsOn: [createReportOpId(draftId: did), attachMediaOpId(photoItemId: beforeId), attachMediaOpId(photoItemId: afterId)],
            state: .queued,
            attemptCount: 0,
            nextAttemptAt: nil,
            lastErrorCode: nil,
            lastErrorMessage: nil,
            createdAt: now,
            updatedAt: now,
            resultReportId: nil,
            resultSessionId: nil,
            resultUploadPath: nil
        )
        opStore.add(op)
        submitEnqueued = true
        OperationQueueExecutor.shared.runLoop()
    }

    private func todayDayId() -> String {
        ISO8601DateFormatter().string(from: Date()).prefix(10).replacingOccurrences(of: "-", with: "")
    }

    private func restoreDraftFromDurableQueueIfNeeded() {
        if let stored = store.state.draftReportId, !stored.isEmpty {
            draftId = stored
            reportId = opStore.operation(id: createReportOpId(draftId: stored))?.resultReportId
        } else {
            let createOps = opStore.operations.filter { $0.type == .createReport }
            guard let latest = createOps.sorted(by: { $0.createdAt > $1.createdAt }).first else { return }
            let prefix = "createReport-"
            guard latest.id.hasPrefix(prefix) else { return }
            let did = String(latest.id.dropFirst(prefix.count))
            draftId = did
            reportId = latest.resultReportId
            store.save { $0.draftReportId = did }
        }
        // Rehydrate photo item ids from createSession purpose payloads.
        for op in opStore.operations where op.type == .createUploadSession {
            let photoId = op.id.replacingOccurrences(of: "createSession-", with: "")
            guard !photoId.isEmpty else { continue }
            if op.payload.purpose == "report_before", beforeItemId == nil {
                beforeItemId = photoId
            } else if op.payload.purpose == "report_after", afterItemId == nil {
                afterItemId = photoId
            }
        }
    }

    #if DEBUG
    /// Phase 5: synthetic solid-color JPEGs enter the same addPhoto → queue → signed upload path as picker photos.
    private func injectE2ESyntheticMediaIfNeeded() {
        guard UITestLaunchHooks.isE2EEnabled, UITestLaunchHooks.e2eInjectSyntheticMedia else { return }
        guard draftId != nil else { return }
        if beforeItemId == nil {
            let before = makeE2ESolidJPEG(color: BrandTokens.uiSurface, seed: 1)
            beforeImage = before
            addPhoto(purpose: "report_before", image: before) { beforeItemId = $0 }
        }
        if afterItemId == nil {
            let after = makeE2ESolidJPEG(color: BrandTokens.uiBgPage, seed: 2)
            afterImage = after
            addPhoto(purpose: "report_after", image: after) { afterItemId = $0 }
        }
    }

    private func makeE2ESolidJPEG(color: UIColor, seed: Int) -> UIImage {
        let size = CGSize(width: 320 + seed, height: 240 + seed)
        let renderer = UIGraphicsImageRenderer(size: size)
        let markerColor = BrandTokens.uiTextPrimary
        return renderer.image { ctx in
            color.setFill()
            ctx.fill(CGRect(origin: .zero, size: size))
            let marker = "P5-\(seed)" as NSString
            marker.draw(at: CGPoint(x: 12, y: 12), withAttributes: [
                .font: UIFont.boldSystemFont(ofSize: 28),
                .foregroundColor: markerColor,
            ])
        }
    }
    #endif
}
