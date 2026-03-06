//
//  OperationQueueExecutor.swift
//  WorkerLite
//
//  Phase 7.3 — Run queued operations when online. Backoff, 401/403 pause, 409 bootstrap.
//

import Foundation
import UIKit

@MainActor
final class OperationQueueExecutor: ObservableObject {
    static let shared = OperationQueueExecutor()
    @Published private(set) var isPaused = false
    @Published private(set) var needsBootstrap = false

    private let opStore = OperationQueueStore.shared
    private let appStore = AppStateStoreManager.shared
    private let network = NetworkMonitor.shared
    private var runTask: Task<Void, Never>?
    private let maxAttempts = 8
    private let baseBackoffSeconds = 2.0

    private init() {
        network.onBecameReachable = { [weak self] in
            Task { @MainActor in
                self?.isPaused = false
                self?.runLoop()
            }
        }
    }

    /// Phase 7.4: throttle interval when no work (5s); at most one uploadBinary running at a time.
    private let idleSleepNanoseconds: UInt64 = 5_000_000_000

    func runLoop() {
        guard network.isConnected, !isPaused else { return }
        runTask?.cancel()
        runTask = Task {
            while !Task.isCancelled, network.isConnected, !isPaused {
                let succeeded = opStore.succeededIds()
                guard let op = opStore.runnable(knownSucceededIds: succeeded) else {
                    try? await Task.sleep(nanoseconds: idleSleepNanoseconds)
                    continue
                }
                let runningUploads = opStore.operations.filter { $0.type == .uploadBinary && $0.state == .running }.count
                if op.type == .uploadBinary && runningUploads >= 1 {
                    try? await Task.sleep(nanoseconds: 2_000_000_000)
                    continue
                }
                await execute(op)
            }
        }
    }

    func pauseQueue() {
        isPaused = true
        runTask?.cancel()
    }

    func resumeQueue() {
        isPaused = false
        runLoop()
    }

    private func execute(_ op: QueuedOperation) async {
        opStore.update(id: op.id) { $0.state = .running }
        let result = await perform(op)
        switch result {
        case .success:
            opStore.update(id: op.id) { $0.state = .succeeded; $0.attemptCount += 1; $0.lastErrorCode = nil; $0.lastErrorMessage = nil }
            // Phase 7.4: do not overwrite draftReportId (keep local draft id for op lookup)
        case .deferred:
            break
        case .retry(let code, let message):
            let attempt = op.attemptCount + 1
            if attempt >= maxAttempts {
                opStore.update(id: op.id) {
                    $0.state = .failed_permanent
                    $0.lastErrorMessage = "Max attempts (\(maxAttempts)) reached. Retry from app."
                }
            } else {
                opStore.update(id: op.id) {
                    $0.state = .queued
                    $0.attemptCount = attempt
                    $0.lastErrorCode = code
                    $0.lastErrorMessage = message
                    $0.nextAttemptAt = nextAttemptDate(attempt: attempt)
                }
            }
        case .permanent(let message):
            opStore.update(id: op.id) {
                $0.state = .failed_permanent
                $0.lastErrorMessage = message
            }
        case .authRequired:
            isPaused = true
            opStore.update(id: op.id) { $0.state = .queued }
        case .needsBootstrap:
            needsBootstrap = true
            opStore.update(id: op.id) { $0.state = .queued }
        }
    }

    private enum ExecuteResult {
        case success
        case deferred  // e.g. uploadBinary scheduled in background; op stays .running until delegate completes
        case retry(code: String?, message: String)
        case permanent(message: String)
        case authRequired
        case needsBootstrap
    }

    private func perform(_ op: QueuedOperation) async -> ExecuteResult {
        do {
            switch op.type {
            case .startShift:
                try await WorkerAPI.startDay(idempotencyKey: op.idempotencyKey)
                let day = op.payload.dayId ?? todayDayId()
                appStore.save {
                    $0.shift.dayId = day
                    $0.shift.startedAt = ISO8601DateFormatter().string(from: Date())
                    $0.shift.endedAt = nil
                }
                return .success
            case .endShift:
                try await WorkerAPI.endDay(idempotencyKey: op.idempotencyKey)
                appStore.save { $0.shift.endedAt = ISO8601DateFormatter().string(from: Date()) }
                return .success
            case .createReport:
                let reportId = try await WorkerAPI.createReport(dayId: op.payload.dayId, taskId: op.payload.taskId, idempotencyKey: op.idempotencyKey)
                opStore.update(id: op.id) { $0.resultReportId = reportId }
                return .success
            case .createUploadSession:
                let (sessionId, uploadPath) = try await WorkerAPI.createUploadSession(purpose: op.payload.purpose ?? "report_before", idempotencyKey: op.idempotencyKey)
                opStore.update(id: op.id) { $0.resultSessionId = sessionId; $0.resultUploadPath = uploadPath }
                return .success
            case .uploadBinary:
                let uploadPath: String? = op.payload.uploadPath ?? op.resultUploadPath ?? op.dependsOn.first.flatMap { opStore.operation(id: $0)?.resultUploadPath }
                guard let uploadPath = uploadPath,
                      let photoItemId = op.payload.photoItemId,
                      let base64 = op.payload.imageDataBase64,
                      let data = Data(base64Encoded: base64),
                      let token = await AuthService.shared.getAccessToken() else {
                    return .permanent(message: "Missing payload or token for uploadBinary")
                }
                let pathInBucket = uploadPath.hasPrefix("media/") ? String(uploadPath.dropFirst("media/".count)) : uploadPath
                let filename = "\(photoItemId.prefix(8)).jpg"
                let storagePath = "\(pathInBucket)/\(filename)"
                try BackgroundUploadService.shared.scheduleUpload(operationId: op.id, storagePath: storagePath, data: data, token: token)
                opStore.update(id: op.id) { $0.payload.sizeBytes = data.count }
                return .deferred
            case .finalizeSession:
                let sessionId = op.payload.sessionId
                    ?? op.dependsOn.compactMap { opStore.operation(id: $0)?.resultSessionId }.first
                    ?? ""
                let objectPath = op.payload.objectPath ?? op.dependsOn.compactMap { opStore.operation(id: $0)?.payload.objectPath }.first ?? ""
                let sizeBytes = op.payload.sizeBytes ?? op.dependsOn.compactMap { opStore.operation(id: $0)?.payload.sizeBytes }.first
                try await WorkerAPI.finalizeUploadSession(sessionId: sessionId, objectPath: objectPath, mimeType: op.payload.mimeType ?? "image/jpeg", sizeBytes: sizeBytes, idempotencyKey: op.idempotencyKey)
                return .success
            case .attachMedia:
                let reportId = op.payload.reportId ?? op.dependsOn.compactMap { opStore.operation(id: $0)?.resultReportId }.first
                let sessionId = op.payload.sessionId ?? op.resultSessionId ?? op.dependsOn.compactMap { opStore.operation(id: $0)?.resultSessionId }.first
                guard let reportId = reportId, let sessionId = sessionId else {
                    return .permanent(message: "Missing reportId/sessionId for attachMedia")
                }
                try await WorkerAPI.addMedia(reportId: reportId, uploadSessionId: sessionId, idempotencyKey: op.idempotencyKey)
                return .success
            case .submitReport:
                let reportId = op.payload.reportId ?? op.dependsOn.compactMap { opStore.operation(id: $0)?.resultReportId }.first
                guard let reportId = reportId else { return .permanent(message: "Missing reportId") }
                try await WorkerAPI.submitReport(reportId: reportId, taskId: op.payload.taskId, idempotencyKey: op.idempotencyKey)
                appStore.save { $0.draftReportId = nil; $0.pendingUploads = [] }
                return .success
            case .syncAck:
                let cursor = op.payload.cursor ?? 0
                try await WorkerAPI.syncAck(cursor: cursor, idempotencyKey: op.idempotencyKey)
                appStore.save { $0.lastSyncCursor = String(cursor) }
                return .success
            }
        } catch let err as APIError {
            if err.isUnauthorized || err.isForbidden { return .authRequired }
            if err.isConflict { return .needsBootstrap }
            if err.statusCode == 429 || (err.statusCode ?? 0) >= 500 { return .retry(code: err.code, message: err.message) }
            if (err.statusCode ?? 0) >= 400 { return .permanent(message: err.message) }
            return .retry(code: err.code, message: err.message)
        } catch {
            return .retry(code: nil, message: error.localizedDescription)
        }
    }

    private func nextAttemptDate(attempt: Int) -> String {
        let sec = min(pow(self.baseBackoffSeconds, Double(attempt)) + Double.random(in: 0...1), 300)
        let date = Date().addingTimeInterval(sec)
        return ISO8601DateFormatter().string(from: date)
    }

    private func todayDayId() -> String {
        ISO8601DateFormatter().string(from: Date()).prefix(10).replacingOccurrences(of: "-", with: "")
    }
}
