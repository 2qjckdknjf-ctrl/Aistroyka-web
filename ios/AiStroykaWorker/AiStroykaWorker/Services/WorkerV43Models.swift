//
//  WorkerV43Models.swift
//  AiStroykaWorker
//

import AVFoundation
import Foundation
import Shared
import SwiftUI
import UIKit
import Vision

enum WorkerTab: String, Hashable, CaseIterable {
    case today
    case tasks
    case messages
    case more
}

enum WorkerV43LaunchFlags {
    static func isOn(
        _ name: String,
        arguments: [String] = ProcessInfo.processInfo.arguments,
        environment: [String: String] = ProcessInfo.processInfo.environment,
        defaults: UserDefaults = .standard
    ) -> Bool {
        if isTruthy(environment[name]) { return true }
        if environment.keys.contains(where: { $0.contains(name) && isTruthy(environment[$0]) }) {
            return true
        }
        if let stored = defaults.object(forKey: name) {
            if let flag = stored as? Bool { return flag }
            if let number = stored as? NSNumber { return number.boolValue }
            if let text = stored as? String, isTruthy(text) { return true }
        }
        return arguments.contains { $0.contains(name) }
    }

    static func isTruthy(_ raw: String?) -> Bool {
        guard let raw else { return false }
        let value = raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        return value == "1" || value == "true" || value == "yes" || value == "preview"
    }
}

enum WorkerV43Preview {
    static var isEnabled: Bool {
        WorkerV43LaunchFlags.isOn("AISTROYKA_WORKER_V43_PREVIEW")
            || ProcessInfo.processInfo.environment["AISTROYKA_UI_TEST"] == "preview"
            || ProcessInfo.processInfo.arguments.contains("-AISTROYKA_UI_TEST=preview")
    }

    static var showsCatalogWithoutAuth: Bool {
        isEnabled
    }
}

@MainActor
final class WorkerInboxBadgeStore: ObservableObject {
    static let shared = WorkerInboxBadgeStore()
    @Published var count = 0
}

@MainActor
final class WorkerTabRouter: ObservableObject {
    @Published var selectedTab: WorkerTab = WorkerTabRouter.initialTab()

    private static func initialTab() -> WorkerTab {
        let raw = ProcessInfo.processInfo.environment["AISTROYKA_WORKER_V43_TAB"]
            ?? ProcessInfo.processInfo.arguments.dropFirst().first(where: { $0.hasPrefix("-AISTROYKA_WORKER_V43_TAB=") })?
            .split(separator: "=").last.map(String.init)
            ?? UserDefaults.standard.string(forKey: "AISTROYKA_WORKER_V43_TAB")
        if let raw, let tab = WorkerTab(rawValue: raw) { return tab }
        if let idx = ProcessInfo.processInfo.arguments.firstIndex(of: "-AISTROYKA_WORKER_V43_TAB"),
           idx + 1 < ProcessInfo.processInfo.arguments.count,
           let tab = WorkerTab(rawValue: ProcessInfo.processInfo.arguments[idx + 1]) {
            return tab
        }
        return .today
    }
    @Published var openShiftStart = false
    @Published var openCameraContext = false
    @Published var cameraContext: WorkerCameraContext = .task
    @Published var pendingTaskId: String?
    @Published var pendingReportId: String?
    @Published var pendingIssueId: String?
    @Published var pendingDocumentId: String?
    @Published var messagesSegment: WorkerMessagesSegment = .chats
    @Published var moreDestination: WorkerMoreDestination = .none
    @Published var previewSurface: WorkerV43PreviewSurface? = WorkerTabRouter.initialSurface()

    private static func initialSurface() -> WorkerV43PreviewSurface? {
        let raw = ProcessInfo.processInfo.environment["AISTROYKA_WORKER_V43_SCREEN"]
            ?? UserDefaults.standard.string(forKey: "AISTROYKA_WORKER_V43_SCREEN")
        switch raw?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {
        case "before", "camera":
            return .before
        case "after":
            return .after
        case "wip":
            return .wip
        case "review":
            return .review
        case "feedback":
            return .feedback
        case "issue":
            return .issue
        case "report", "reports":
            return .report
        default:
            return nil
        }
    }

    func openTask(_ id: String) {
        pendingTaskId = id
        selectedTab = .tasks
    }

    func openMessages() {
        selectedTab = .messages
    }

    func openIssues(taskId: String? = nil) {
        if let taskId { pendingTaskId = taskId }
        moreDestination = .issues
        selectedTab = .more
    }

    func openDocuments() {
        moreDestination = .documents
        selectedTab = .more
    }

    func openReports() {
        moreDestination = .reports
        selectedTab = .more
    }

    func consumeMoreDestination() -> WorkerMoreDestination {
        let value = moreDestination
        moreDestination = .none
        return value
    }
}

enum WorkerMoreDestination: String {
    case none
    case issues
    case documents
    case reports
}

enum WorkerV43PreviewSurface: String, Identifiable {
    case before
    case after
    case wip
    case review
    case feedback
    case issue
    case report

    var id: String { rawValue }
}

enum WorkerCameraContext: String, CaseIterable {
    case task
    case report
    case issue
}

enum WorkerMessagesSegment: String, CaseIterable {
    case chats
    case notifications
    case announcements
}

enum WorkerTaskFilter: String, CaseIterable {
    case today
    case week
    case done
}

enum WorkerIssueFilter: String, CaseIterable {
    case open
    case mine
    case closed
}

enum WorkerIssueCategory: String, CaseIterable {
    case all
    case safety
    case quality
    case materials
}

enum WorkerDocumentTab: String, CaseIterable {
    case myTasks
    case drawings
    case instructions
    case acts
}

enum WorkerPhotoKind: String {
    case before = "report_before"
    case after = "report_after"
    case issue = "issue_evidence"
}

enum WorkerSyncLabel {
    static func from(status: SyncStatus, lastSync: Date?) -> (String, WorkerV43StatusPill.Kind) {
        switch status {
        case .synced:
            return (
                String(format: NSLocalizedString("wrk_v43_sync_ok_fmt", comment: ""), WorkerV43Formatters.relativeSync(lastSync)),
                .success
            )
        case .syncing:
            return (NSLocalizedString("sync_status_syncing", comment: ""), .info)
        case .offline:
            return (NSLocalizedString("sync_status_offline", comment: ""), .warning)
        case .error, .needsBootstrap:
            return (NSLocalizedString("sync_status_error", comment: ""), .danger)
        case .idle:
            return (NSLocalizedString("sync_status_idle", comment: ""), .neutral)
        }
    }
}

enum WorkerReportGate {
    static func canFinishTask(requiredStepsDone: Bool, beforeReady: Bool, afterReady: Bool) -> Bool {
        requiredStepsDone && beforeReady && afterReady
    }

    static func blockedReason(requiredStepsDone: Bool, beforeReady: Bool, afterReady: Bool) -> String? {
        if canFinishTask(requiredStepsDone: requiredStepsDone, beforeReady: beforeReady, afterReady: afterReady) {
            return nil
        }
        if !beforeReady { return NSLocalizedString("wrk_v43_gate_need_before", comment: "") }
        if !requiredStepsDone { return NSLocalizedString("wrk_v43_gate_need_steps", comment: "") }
        if !afterReady { return NSLocalizedString("wrk_v43_gate_need_after", comment: "") }
        return NSLocalizedString("worker_error_proof_required", comment: "")
    }
}

struct WorkerIssueDTO: Identifiable, Hashable, Codable {
    var id: String
    var projectId: String
    var title: String
    var description: String?
    var status: String
    var taskId: String?
    var createdAt: String?
    var updatedAt: String?
    var evidenceUploadSessionId: String? = nil
    var evidenceUrl: String? = nil

    enum CodingKeys: String, CodingKey {
        case id
        case projectId = "project_id"
        case title
        case description
        case status
        case taskId = "task_id"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case evidenceUploadSessionId = "evidence_upload_session_id"
        case evidenceUrl = "evidence_url"
    }
}

struct WorkerDocumentDTO: Identifiable, Hashable, Codable {
    var id: String
    var projectId: String
    var title: String
    var type: String
    var status: String
    var objectPath: String?
    var openUrl: String?
    var updatedAt: String?
    var taskId: String?

    var previewURL: URL? {
        if let openUrl, let url = URL(string: openUrl) { return url }
        if let objectPath, let url = URL(string: objectPath), url.scheme != nil { return url }
        return nil
    }

    enum CodingKeys: String, CodingKey {
        case id
        case projectId = "project_id"
        case title
        case type
        case status
        case objectPath = "object_path"
        case openUrl = "open_url"
        case updatedAt = "updated_at"
        case taskId = "task_id"
    }
}

struct WorkerSettingsState: Codable, Equatable {
    var notificationsEnabled: Bool
    var cameraQuality: String
    var geoScope: String
    var dataSaver: Bool
    var aiAssistant: Bool
    var languageCode: String
    var pendingInviteToken: String?

    static func `default`() -> WorkerSettingsState {
        WorkerSettingsState(
            notificationsEnabled: true,
            cameraQuality: "high",
            geoScope: "shift",
            dataSaver: true,
            aiAssistant: true,
            languageCode: Locale.preferredLanguages.first.flatMap { String($0.prefix(2)) } ?? "en",
            pendingInviteToken: nil
        )
    }
}

enum WorkerSettingsStore {
    private static let key = "wrk.v43.settings.v1"

    static func load() -> WorkerSettingsState {
        guard let data = UserDefaults.standard.data(forKey: key),
              let value = try? JSONDecoder().decode(WorkerSettingsState.self, from: data) else {
            return .default()
        }
        return value
    }

    static func save(_ value: WorkerSettingsState) {
        if let data = try? JSONEncoder().encode(value) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }
}

enum WorkerCacheStore {
    static func save<T: Encodable>(_ value: T, key: String) {
        guard let data = try? JSONEncoder().encode(value) else { return }
        UserDefaults.standard.set(data, forKey: key)
        UserDefaults.standard.set(Date().timeIntervalSince1970, forKey: key + ".syncedAt")
    }

    static func load<T: Decodable>(_ type: T.Type, key: String) -> T? {
        guard let data = UserDefaults.standard.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(type, from: data)
    }

    static func lastSync(key: String) -> Date? {
        let raw = UserDefaults.standard.double(forKey: key + ".syncedAt")
        return raw > 0 ? Date(timeIntervalSince1970: raw) : nil
    }
}

struct WorkerSafetyCheckState: Codable, Equatable {
    var helmet: Bool
    var harness: Bool
    var tools: Bool
    var zone: Bool
    var confirmed: Bool
    var dayKey: String

    static func empty(dayKey: String) -> WorkerSafetyCheckState {
        WorkerSafetyCheckState(helmet: false, harness: false, tools: false, zone: false, confirmed: false, dayKey: dayKey)
    }

    var allRequired: Bool { helmet && harness && tools && zone && confirmed }
}

enum WorkerSafetyStore {
    private static let key = "wrk.v43.safety.v1"

    static func load(dayKey: String) -> WorkerSafetyCheckState {
        guard let data = UserDefaults.standard.data(forKey: key),
              let value = try? JSONDecoder().decode(WorkerSafetyCheckState.self, from: data),
              value.dayKey == dayKey else {
            return .empty(dayKey: dayKey)
        }
        return value
    }

    static func save(_ value: WorkerSafetyCheckState) {
        if let data = try? JSONEncoder().encode(value) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }
}

struct WorkerShiftEvidence: Codable, Equatable {
    var startedAt: String?
    var endedAt: String?
    var latitude: Double?
    var longitude: Double?
    var locationAccuracy: Double?
}

enum WorkerShiftEvidenceStore {
    private static let key = "wrk.v43.shift.evidence.v1"

    static func load() -> WorkerShiftEvidence {
        guard let data = UserDefaults.standard.data(forKey: key),
              let value = try? JSONDecoder().decode(WorkerShiftEvidence.self, from: data) else {
            return WorkerShiftEvidence(startedAt: nil, endedAt: nil, latitude: nil, longitude: nil, locationAccuracy: nil)
        }
        return value
    }

    static func save(_ value: WorkerShiftEvidence) {
        if let data = try? JSONEncoder().encode(value) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }
}

struct WorkerTaskProgress: Codable, Equatable {
    var taskId: String
    var completedStepIndexes: [Int]
    var actualVolume: Double
    var plannedVolume: Double
    var crewCount: Int
    var measurementMm: Int?

    var progress: Double {
        guard !completedStepIndexes.isEmpty else { return 0 }
        return WorkerV43Formatters.clampedProgress(Double(completedStepIndexes.count) / 5.0)
    }

    func managerNote() -> String {
        String(
            format: NSLocalizedString("wrk_v43_progress_note_fmt", comment: ""),
            completedStepIndexes.count,
            actualVolume,
            plannedVolume
        )
    }
}

extension Notification.Name {
    static let workerV43SubmitReport = Notification.Name("ai.aistroyka.worker.v43.submitReport")
}

enum WorkerReportOpIds {
    static func createReport(draftId: String) -> String { "createReport-\(draftId)" }
    static func submitReport(draftId: String) -> String { "submitReport-\(draftId)" }
}

@MainActor
enum WorkerTaskChatActions {
    @discardableResult
    static func enqueueOfflineText(taskId: String, body: String, clientId: String) -> Bool {
        let now = ISO8601DateFormatter().string(from: Date())
        let op = QueuedOperation(
            id: UUID().uuidString,
            type: .sendTaskMessage,
            payload: OperationPayload(
                taskId: taskId,
                messageBody: body,
                clientId: clientId
            ),
            idempotencyKey: clientId,
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
        OperationQueueStore.shared.add(op)
        OperationQueueExecutor.shared.runLoop()
        return true
    }
}

enum WorkerTaskProgressStore {
    private static func key(_ taskId: String) -> String { "wrk.v43.task.progress.\(taskId)" }

    static func load(taskId: String) -> WorkerTaskProgress {
        if let data = UserDefaults.standard.data(forKey: key(taskId)),
           let value = try? JSONDecoder().decode(WorkerTaskProgress.self, from: data) {
            return value
        }
        return WorkerTaskProgress(
            taskId: taskId,
            completedStepIndexes: [],
            actualVolume: 0,
            plannedVolume: 48,
            crewCount: 1,
            measurementMm: nil
        )
    }

    static func save(_ value: WorkerTaskProgress) {
        if let data = try? JSONEncoder().encode(value) {
            UserDefaults.standard.set(data, forKey: key(value.taskId))
        }
    }
}

enum WorkerPhotoEvidence {
    static let minPixelCount: CGFloat = 180_000
    static let minLaplacianVariance: Double = 40
    static let lowStorageBytes: Int64 = 50 * 1024 * 1024
    static let visionMatchDistance: Float = 0.45
    static let histogramMatch: Double = 0.72

    static var cameraDenied: Bool {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .denied, .restricted:
            return true
        default:
            return false
        }
    }

    static func isSharp(_ image: UIImage?) -> Bool {
        guard let image else { return true }
        let pixels = image.size.width * image.size.height * max(image.scale, 1)
        if pixels < minPixelCount { return false }
        return laplacianVariance(image) >= minLaplacianVariance || pixels >= 400_000
    }

    static func isSharp(pixelCount: CGFloat, variance: Double) -> Bool {
        if pixelCount < minPixelCount { return false }
        return variance >= minLaplacianVariance || pixelCount >= 400_000
    }

    static func angleMatch(current: UIImage?, reference: UIImage?) -> Bool? {
        guard let current, let reference else { return nil }
        if let distance = visionDistance(current, reference) {
            return distance < visionMatchDistance
        }
        return histogramCorrelation(current, reference) >= histogramMatch
    }

    static func isLowStorage(availableBytes: Int64? = nil) -> Bool {
        let bytes = availableBytes ?? volumeAvailableBytes()
        return bytes < lowStorageBytes
    }

    static func persistPending(image: UIImage, purpose: String, taskId: String?) {
        guard let jpeg = image.jpegData(compressionQuality: 0.85) else { return }
        let store = AppStateStoreManager.shared
        let now = ISO8601DateFormatter().string(from: Date())
        let item = PendingUploadItem(
            id: UUID().uuidString,
            purpose: purpose,
            reportId: store.state.draftReportId ?? "",
            sessionId: nil,
            uploadPath: nil,
            objectPath: nil,
            phase: "queued",
            lastError: nil,
            idempotencyKeyCreate: DeviceContext.newIdempotencyKey(),
            idempotencyKeyFinalize: DeviceContext.newIdempotencyKey(),
            idempotencyKeyAddMedia: DeviceContext.newIdempotencyKey(),
            createdAt: now,
            imageDataBase64: jpeg.base64EncodedString()
        )
        store.save {
            $0.pendingUploads.append(item)
            if let taskId { $0.draftTaskId = taskId }
        }
    }

    static func pendingImage(purpose: String) -> UIImage? {
        let items = AppStateStoreManager.shared.state.pendingUploads.reversed()
        for item in items where item.purpose == purpose {
            if let raw = item.imageDataBase64, let data = Data(base64Encoded: raw), let image = UIImage(data: data) {
                return image
            }
        }
        return nil
    }

    static func saveReference(taskId: String, kind: WorkerPhotoKind, image: UIImage) {
        guard let jpeg = image.jpegData(compressionQuality: 0.85) else { return }
        try? jpeg.write(to: referenceURL(taskId: taskId, kind: kind), options: .atomic)
    }

    static func loadReference(taskId: String, kind: WorkerPhotoKind) -> UIImage? {
        let url = referenceURL(taskId: taskId, kind: kind)
        guard let data = try? Data(contentsOf: url) else { return nil }
        return UIImage(data: data)
    }

    private static func referenceURL(taskId: String, kind: WorkerPhotoKind) -> URL {
        FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("wrk-v43-\(taskId)-\(kind.rawValue).jpg")
    }

    private static func volumeAvailableBytes() -> Int64 {
        let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let values = try? url.resourceValues(forKeys: [.volumeAvailableCapacityForImportantUsageKey])
        return values?.volumeAvailableCapacityForImportantUsage ?? Int64.max
    }

    private static func laplacianVariance(_ image: UIImage) -> Double {
        guard let cg = image.cgImage else { return 0 }
        let width = 64
        let height = 64
        var pixels = [UInt8](repeating: 0, count: width * height)
        guard let ctx = CGContext(
            data: &pixels,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: width,
            space: CGColorSpaceCreateDeviceGray(),
            bitmapInfo: 0
        ) else { return 0 }
        ctx.draw(cg, in: CGRect(x: 0, y: 0, width: width, height: height))
        var acc = 0.0
        var acc2 = 0.0
        var n = 0.0
        for y in 1..<(height - 1) {
            for x in 1..<(width - 1) {
                let i = y * width + x
                let lap = Double(Int(pixels[i - 1]) + Int(pixels[i + 1]) + Int(pixels[i - width]) + Int(pixels[i + width]) - 4 * Int(pixels[i]))
                acc += lap
                acc2 += lap * lap
                n += 1
            }
        }
        guard n > 0 else { return 0 }
        let mean = acc / n
        return acc2 / n - mean * mean
    }

    private static func visionDistance(_ a: UIImage, _ b: UIImage) -> Float? {
        guard let fa = featurePrint(a), let fb = featurePrint(b) else { return nil }
        var distance: Float = 0
        do {
            try fa.computeDistance(&distance, to: fb)
            return distance
        } catch {
            return nil
        }
    }

    private static func featurePrint(_ image: UIImage) -> VNFeaturePrintObservation? {
        guard let cg = image.cgImage else { return nil }
        let request = VNGenerateImageFeaturePrintRequest()
        let handler = VNImageRequestHandler(cgImage: cg, options: [:])
        do {
            try handler.perform([request])
            return request.results?.first as? VNFeaturePrintObservation
        } catch {
            return nil
        }
    }

    private static func histogramCorrelation(_ a: UIImage, _ b: UIImage) -> Double {
        let ha = histogram(a)
        let hb = histogram(b)
        guard ha.count == hb.count, !ha.isEmpty else { return 0 }
        var dot = 0.0
        var na = 0.0
        var nb = 0.0
        for i in 0..<ha.count {
            dot += ha[i] * hb[i]
            na += ha[i] * ha[i]
            nb += hb[i] * hb[i]
        }
        let denom = sqrt(na * nb)
        return denom > 0 ? dot / denom : 0
    }

    private static func histogram(_ image: UIImage) -> [Double] {
        guard let cg = image.cgImage else { return [] }
        let width = 32
        let height = 32
        var pixels = [UInt8](repeating: 0, count: width * height)
        guard let ctx = CGContext(
            data: &pixels,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: width,
            space: CGColorSpaceCreateDeviceGray(),
            bitmapInfo: 0
        ) else { return [] }
        ctx.draw(cg, in: CGRect(x: 0, y: 0, width: width, height: height))
        var bins = [Double](repeating: 0, count: 16)
        for value in pixels {
            bins[Int(value) / 16] += 1
        }
        return bins
    }
}
