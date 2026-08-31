//
//  ReportResubmitView.swift
//  AiStroykaWorker
//
//  Resubmit when manager status is `changes_requested`. Existing proof stays required;
//  a new photo attaches via POST /api/v1/worker/report/add-media before submit.
//

import SwiftUI
import UIKit
import Shared

struct ReportResubmitView: View {
    let reportId: String
    @StateObject private var opStore = OperationQueueStore.shared
    @State private var detail: WorkerReportDetailData?
    @State private var loadError: String?
    @State private var loading = true
    @State private var submitJobId: String?
    @State private var submitted = false
    @State private var workerReplyNote = ""
    @State private var correctionImage: UIImage?
    @State private var showCamera = false
    @State private var attachingPhoto = false
    @State private var attachError: String?
    @State private var attachedSessionId: String?

    private var trimmedReplyNote: String {
        workerReplyNote.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var activeSubmitOp: QueuedOperation? {
        guard let submitJobId else { return nil }
        return opStore.operation(id: submitJobId)
    }

    private var submitInFlight: Bool {
        guard let op = activeSubmitOp else { return false }
        return op.state == .queued || op.state == .running
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if loading {
                    ProgressView(NSLocalizedString("worker_loading_report", comment: ""))
                }
                if let loadError {
                    Text(WorkerV43Copy.userFacing(loadError)).foregroundColor(.red).font(.caption)
                }

                Text(String(format: NSLocalizedString("worker_report_id_short_fmt", comment: ""), String(reportId.prefix(8))))
                    .font(.caption)
                    .foregroundStyle(.secondary)

                if let wn = detail?.workerNote, !wn.isEmpty {
                    Text(NSLocalizedString("worker_your_previous_note_title", comment: ""))
                        .font(.subheadline).fontWeight(.semibold)
                    Text(wn)
                        .font(.body)
                }

                if let actual = detail?.actualVolume, let planned = detail?.plannedVolume {
                    Text(String(format: NSLocalizedString("wrk_v43_volume_pair_fmt", comment: ""), actual, planned))
                        .font(.subheadline)
                        .foregroundStyle(WorkerV43.textPrimary)
                } else if let actual = detail?.actualVolume {
                    Text(String(format: NSLocalizedString("wrk_v43_volume_m3_fmt", comment: ""), actual))
                        .font(.subheadline)
                        .foregroundStyle(WorkerV43.textPrimary)
                } else if let planned = detail?.plannedVolume {
                    Text(String(format: NSLocalizedString("wrk_v43_volume_m3_fmt", comment: ""), planned))
                        .font(.subheadline)
                        .foregroundStyle(WorkerV43.textPrimary)
                }

                if let note = detail?.managerNote, !note.isEmpty {
                    Text(NSLocalizedString("worker_manager_note_title", comment: ""))
                        .font(.subheadline).fontWeight(.semibold)
                    Text(note)
                        .font(.body)
                }

                Text(NSLocalizedString("worker_resubmit_hint", comment: ""))
                    .font(.caption)
                    .foregroundStyle(.secondary)

                if let media = detail?.media, !media.isEmpty {
                    Text(NSLocalizedString("worker_evidence_section_title", comment: ""))
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    ForEach(Array(media.enumerated()), id: \.offset) { idx, m in
                        WorkerReportEvidenceItemView(index: idx + 1, item: m)
                    }
                }

                if detail?.status == "changes_requested" {
                    if let correctionImage {
                        Image(uiImage: correctionImage)
                            .resizable()
                            .scaledToFill()
                            .frame(height: 180)
                            .clipped()
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                            .accessibilityLabel(NSLocalizedString("wrk_v43_resubmit_photo", comment: ""))
                    }
                    WorkerV43PrimaryButton(
                        title: NSLocalizedString("wrk_v43_resubmit_photo", comment: ""),
                        systemImage: "camera",
                        enabled: !submitted && !attachingPhoto,
                        fill: WorkerV43.warning
                    ) { showCamera = true }
                    .accessibilityIdentifier("pilot_worker_resubmit_camera")
                    if let attachError {
                        Text(attachError).font(.caption).foregroundStyle(WorkerV43.danger)
                    }
                    VStack(alignment: .leading, spacing: 6) {
                        Text(NSLocalizedString("worker_resubmit_note_label", comment: ""))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        TextField(
                            NSLocalizedString("worker_resubmit_note_placeholder", comment: ""),
                            text: $workerReplyNote,
                            axis: .vertical
                        )
                        .lineLimit(2...5)
                        .textFieldStyle(.roundedBorder)
                        .accessibilityIdentifier("pilot_worker_resubmit_note")
                    }
                    WorkerV43PrimaryButton(
                        title: NSLocalizedString("worker_submit_again", comment: ""),
                        systemImage: "paperplane.fill",
                        enabled: !submitted && !submitInFlight && !attachingPhoto,
                        loading: submitInFlight || attachingPhoto
                    ) { enqueueSubmit() }
                    .accessibilityIdentifier("pilot_worker_submit_again")
                } else if let st = detail?.status {
                    Text(String(format: NSLocalizedString("worker_report_status_fmt", comment: ""), st))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                if let err = submitErrorMessage {
                    Text(err).foregroundColor(.red).font(.caption)
                }
                if submitted {
                    Text(NSLocalizedString("worker_submitted", comment: "")).foregroundColor(.green)
                }
            }
            .padding()
        }
        .aistroykaPageBackground(WorkerSemanticColors.pageBackground)
        .navigationTitle(NSLocalizedString("worker_report_resubmit_title", comment: ""))
        .navigationBarTitleDisplayMode(.inline)
        .fullScreenCover(isPresented: $showCamera) {
            CameraPicker(image: $correctionImage)
        }
        .onAppear(perform: loadDetail)
        .onChange(of: opStore.operations) { _ in
            guard let op = activeSubmitOp else { return }
            if op.state == .succeeded {
                submitted = true
            }
        }
    }

    private var submitErrorMessage: String? {
        guard let op = activeSubmitOp, op.state == .failed_permanent else { return nil }
        if op.lastErrorCode == "proof_required" {
            return NSLocalizedString("worker_error_proof_required", comment: "")
        }
        if op.lastErrorCode == "max_attempts" {
            return NSLocalizedString("worker_error_max_attempts", comment: "")
        }
        if let msg = op.lastErrorMessage, !msg.isEmpty { return msg }
        return NSLocalizedString("worker_error_generic", comment: "")
    }

    private func loadDetail() {
        if WorkerV43Preview.showsCatalogWithoutAuth {
            detail = WorkerV43PreviewCatalog.reportDetail(id: reportId)
            loading = false
            loadError = nil
            return
        }
        Task {
            do {
                let d = try await WorkerAPI.reportDetail(id: reportId)
                await MainActor.run {
                    detail = d
                    loading = false
                    loadError = nil
                }
            } catch {
                await MainActor.run {
                    loadError = WorkerV43Copy.userFacing(error)
                    loading = false
                }
            }
        }
    }

    private func enqueueSubmit() {
        if WorkerV43Preview.showsCatalogWithoutAuth {
            if let correctionImage {
                WorkerPhotoEvidence.persistPending(
                    image: correctionImage,
                    purpose: WorkerPhotoKind.after.rawValue,
                    taskId: detail?.taskId
                )
            }
            submitted = true
            return
        }
        if attachingPhoto || submitInFlight || submitted { return }
        Task { await attachCorrectionThenSubmit() }
    }

    @MainActor
    private func attachCorrectionThenSubmit() async {
        if let correctionImage, attachedSessionId == nil {
            WorkerPhotoEvidence.persistPending(
                image: correctionImage,
                purpose: WorkerPhotoKind.after.rawValue,
                taskId: detail?.taskId
            )
            attachingPhoto = true
            attachError = nil
            do {
                guard let jpeg = correctionImage.jpegData(compressionQuality: 0.85) else {
                    attachError = NSLocalizedString("worker_error_generic", comment: "")
                    attachingPhoto = false
                    return
                }
                let sessionId = try await WorkerAPI.uploadEvidence(
                    purpose: WorkerPhotoKind.after.rawValue,
                    jpeg: jpeg
                )
                try await WorkerAPI.addMedia(
                    reportId: reportId,
                    uploadSessionId: sessionId,
                    idempotencyKey: DeviceContext.newIdempotencyKey()
                )
                attachedSessionId = sessionId
            } catch {
                attachError = WorkerV43Copy.userFacing(error)
                attachingPhoto = false
                return
            }
            attachingPhoto = false
        }
        queueSubmitOperation()
    }

    private func queueSubmitOperation() {
        let jobId = "submitResubmit-\(reportId)-\(UUID().uuidString)"
        submitJobId = jobId
        let taskId = detail?.taskId
        let key = DeviceContext.newIdempotencyKey()
        let now = ISO8601DateFormatter().string(from: Date())
        let reply = trimmedReplyNote.isEmpty ? nil : String(trimmedReplyNote.prefix(2000))
        let op = QueuedOperation(
            id: jobId,
            type: .submitReport,
            payload: OperationPayload(
                dayId: nil,
                taskId: taskId,
                reportId: reportId,
                purpose: nil,
                photoItemId: nil,
                sessionId: nil,
                uploadPath: nil,
                objectPath: nil,
                mimeType: nil,
                sizeBytes: nil,
                imageDataBase64: nil,
                cursor: nil,
                workerNote: reply
            ),
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
}

// MARK: - Evidence thumbnails (same URL contract as Manager `ReportEvidenceItemView`)

private struct WorkerReportEvidenceItemView: View {
    let index: Int
    let item: WorkerReportMediaItem

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let urlStr = item.fileUrl, let url = URL(string: urlStr), !urlStr.isEmpty {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        ProgressView()
                            .frame(maxWidth: .infinity, minHeight: 120)
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFit()
                            .frame(maxHeight: 240)
                            .cornerRadius(8)
                    case .failure:
                        Text(String(format: NSLocalizedString("worker_evidence_load_failed_fmt", comment: ""), index))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    @unknown default:
                        EmptyView()
                    }
                }
            } else {
                Text(String(format: NSLocalizedString("worker_evidence_no_preview_fmt", comment: ""), index, evidenceShortId))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    private var evidenceShortId: String {
        let raw = item.mediaId ?? item.uploadSessionId ?? "—"
        guard raw.count > 10 else { return raw }
        return String(raw.prefix(8)) + "…"
    }
}
