//
//  ReportResubmitView.swift
//  AiStroykaWorker
//
//  Resubmit flow when manager status is `changes_requested` (existing proof only; see server report.service).
//

import SwiftUI
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
                    Text(loadError).foregroundColor(.red).font(.caption)
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
                    Button(NSLocalizedString("worker_submit_again", comment: "")) {
                        enqueueSubmit()
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(WorkerSemanticColors.primary)
                    .disabled(submitted || submitInFlight)
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
                    loadError = (error as? APIError)?.message ?? error.localizedDescription
                    loading = false
                }
            }
        }
    }

    private func enqueueSubmit() {
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
