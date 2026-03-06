//
//  ReportCreateView.swift
//  WorkerLite
//
//  Phase 7.4 — Full report pipeline via operation queue (no direct UploadManager critical path).
//

import SwiftUI

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

    private var store: AppStateStoreManager { AppStateStoreManager.shared }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if let title = taskTitle, !title.isEmpty {
                Text("Report for task: \(title)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            if draftId == nil {
                Button("Create report") { enqueueCreateReport() }
            } else if let did = draftId {
                Text("Draft: \(String(did.prefix(8)))…").font(.caption)
                if let rid = reportId { Text("Report: \(rid)").font(.caption) }
                Group {
                    HStack {
                        Button("Before photo") { showImageSourceBefore = true }
                        if let id = beforeItemId { photoStatusRow(photoItemId: id, label: "Before") }
                    }
                    HStack {
                        Button("After photo") { showImageSourceAfter = true }
                        if let id = afterItemId { photoStatusRow(photoItemId: id, label: "After") }
                    }
                }
                let beforeAttachDone = beforeItemId.flatMap { opStore.operation(id: attachMediaOpId(photoItemId: $0)) }?.state == .succeeded
                let afterAttachDone = afterItemId.flatMap { opStore.operation(id: attachMediaOpId(photoItemId: $0)) }?.state == .succeeded
                if beforeAttachDone && afterAttachDone && beforeItemId != nil && afterItemId != nil {
                    Button("Submit report") { enqueueSubmitReport() }
                        .disabled(submitEnqueued)
                }
            }
            if let err = errorMessage { Text(err).foregroundColor(.red).font(.caption) }
            if submitEnqueued && !submitted { Text("Submit queued").foregroundColor(.green) }
            if submitted { Text("Submitted").foregroundColor(.green) }
        }
        .padding()
        .confirmationDialog("Before photo", isPresented: $showImageSourceBefore) {
            Button("Take photo") { showCameraBefore = true }
            Button("Choose from library") { showImagePickerBefore = true }
            Button("Cancel", role: .cancel) {}
        }
        .confirmationDialog("After photo", isPresented: $showImageSourceAfter) {
            Button("Take photo") { showCameraAfter = true }
            Button("Choose from library") { showImagePickerAfter = true }
            Button("Cancel", role: .cancel) {}
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
            }
        }
        .onChange(of: opStore.operations) { _, _ in
            if let did = draftId {
                reportId = opStore.operation(id: createReportOpId(draftId: did))?.resultReportId
                if opStore.operation(id: submitReportOpId(draftId: did))?.state == .succeeded {
                    submitted = true
                    store.save { $0.draftTaskId = nil }
                }
            }
        }
        .onChange(of: beforeImage) { _, new in
            guard let img = new, draftId != nil, beforeItemId == nil else { return }
            addPhoto(purpose: "report_before", image: img) { beforeItemId = $0 }
        }
        .onChange(of: afterImage) { _, new in
            guard let img = new, draftId != nil, afterItemId == nil else { return }
            addPhoto(purpose: "report_after", image: img) { afterItemId = $0 }
        }
    }

    private func photoStatusRow(photoItemId: String, label: String) -> some View {
        let attachOp = opStore.operation(id: attachMediaOpId(photoItemId: photoItemId))
        let state = attachOp?.state ?? .queued
        return HStack(spacing: 4) {
            Text("\(label): \(stateLabel(state))").font(.caption2)
            if state == .failed_permanent || (state == .queued && (attachOp?.attemptCount ?? 0) > 0) {
                Button("Retry") { retryPhotoChain(photoItemId: photoItemId) }
            }
        }
    }

    private func stateLabel(_ state: OperationState) -> String {
        switch state {
        case .queued: return "queued"
        case .running: return "running"
        case .succeeded: return "done"
        case .failed_permanent: return "failed"
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
        let day = dayId ?? todayDayId()
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
        func mkPayload(dayId: String? = nil, taskId: String? = nil, reportId: String? = nil, purpose: String? = nil, photoItemId: String? = nil, sessionId: String? = nil, uploadPath: String? = nil, objectPath: String? = nil, mimeType: String? = nil, sizeBytes: Int? = nil, imageDataBase64: String? = nil, cursor: Int? = nil) -> OperationPayload {
            OperationPayload(dayId: dayId, taskId: taskId, reportId: reportId, purpose: purpose, photoItemId: photoItemId, sessionId: sessionId, uploadPath: uploadPath, objectPath: objectPath, mimeType: mimeType, sizeBytes: sizeBytes, imageDataBase64: imageDataBase64, cursor: cursor)
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
        opStore.update(id: createSessionOpId(photoItemId: photoItemId)) { $0.state = .queued; $0.nextAttemptAt = nil }
        opStore.update(id: uploadBinaryOpId(photoItemId: photoItemId)) { $0.state = .queued; $0.nextAttemptAt = nil }
        opStore.update(id: finalizeOpId(photoItemId: photoItemId)) { $0.state = .queued; $0.nextAttemptAt = nil }
        opStore.update(id: attachMediaOpId(photoItemId: photoItemId)) { $0.state = .queued; $0.nextAttemptAt = nil }
        OperationQueueExecutor.shared.runLoop()
    }

    private func enqueueSubmitReport() {
        guard let did = draftId, let beforeId = beforeItemId, let afterId = afterItemId else { return }
        let taskIdForSubmit = taskId ?? store.state.draftTaskId
        let key = DeviceContext.newIdempotencyKey()
        let now = ISO8601DateFormatter().string(from: Date())
        let op = QueuedOperation(
            id: submitReportOpId(draftId: did),
            type: .submitReport,
            payload: OperationPayload(dayId: nil, taskId: taskIdForSubmit, reportId: nil, purpose: nil, photoItemId: nil, sessionId: nil, uploadPath: nil, objectPath: nil, mimeType: nil, sizeBytes: nil, imageDataBase64: nil, cursor: nil),
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
}
