//
//  AppStateStore.swift
//  WorkerLite
//
//  Phase 7.2 — Persistent app state (survives relaunch). Atomic file-based JSON.
//

import Foundation

struct ShiftState: Codable, Equatable {
    var dayId: String?
    var startedAt: String? // ISO8601
    var endedAt: String?
    var isStarted: Bool { startedAt != nil && endedAt == nil }
}

/// Per-day idempotency keys for shift (Phase 7.3). Retries reuse same key.
struct ShiftIdempotencyKeys: Codable, Equatable {
    var startKey: String?
    var endKey: String?
}

struct PendingUploadItem: Codable, Equatable {
    var id: String // UUID string
    var purpose: String // report_before | report_after
    var reportId: String
    var sessionId: String?
    var uploadPath: String?
    var objectPath: String?
    var phase: String // queued, creatingSession, uploading, finalizing, attaching, done, failed
    var lastError: String?
    var idempotencyKeyCreate: String
    var idempotencyKeyFinalize: String
    var idempotencyKeyAddMedia: String
    var createdAt: String
    var imageDataBase64: String? // small thumbnail or full JPEG for retry; optional to save space
}

struct AppStateStore: Codable, Equatable {
    var selectedProjectId: String?
    var shift: ShiftState
    var draftReportId: String?
    /// Phase 7.5: task id when report draft is for a specific task (UI only; backend does not accept task_id yet).
    var draftTaskId: String?
    var pendingUploads: [PendingUploadItem]
    var lastSyncCursor: String?
    var shiftIdempotencyKeys: [String: ShiftIdempotencyKeys]
    /// Phase 7.4: createReport idempotency key per draft (draftId -> key).
    var draftReportCreateKey: [String: String]
    var updatedAt: String

    enum CodingKeys: String, CodingKey {
        case selectedProjectId, shift, draftReportId, draftTaskId, pendingUploads, lastSyncCursor, updatedAt
        case shiftIdempotencyKeys
        case draftReportCreateKey
    }

    init(selectedProjectId: String?, shift: ShiftState, draftReportId: String?, draftTaskId: String?, pendingUploads: [PendingUploadItem], lastSyncCursor: String?, shiftIdempotencyKeys: [String: ShiftIdempotencyKeys], draftReportCreateKey: [String: String], updatedAt: String) {
        self.selectedProjectId = selectedProjectId
        self.shift = shift
        self.draftReportId = draftReportId
        self.draftTaskId = draftTaskId
        self.pendingUploads = pendingUploads
        self.lastSyncCursor = lastSyncCursor
        self.shiftIdempotencyKeys = shiftIdempotencyKeys
        self.draftReportCreateKey = draftReportCreateKey
        self.updatedAt = updatedAt
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        selectedProjectId = try c.decodeIfPresent(String.self, forKey: .selectedProjectId)
        shift = try c.decode(ShiftState.self, forKey: .shift)
        draftReportId = try c.decodeIfPresent(String.self, forKey: .draftReportId)
        draftTaskId = try c.decodeIfPresent(String.self, forKey: .draftTaskId)
        pendingUploads = try c.decode([PendingUploadItem].self, forKey: .pendingUploads)
        lastSyncCursor = try c.decodeIfPresent(String.self, forKey: .lastSyncCursor)
        shiftIdempotencyKeys = try c.decodeIfPresent([String: ShiftIdempotencyKeys].self, forKey: .shiftIdempotencyKeys) ?? [:]
        draftReportCreateKey = try c.decodeIfPresent([String: String].self, forKey: .draftReportCreateKey) ?? [:]
        updatedAt = try c.decode(String.self, forKey: .updatedAt)
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(selectedProjectId, forKey: .selectedProjectId)
        try c.encode(shift, forKey: .shift)
        try c.encodeIfPresent(draftReportId, forKey: .draftReportId)
        try c.encodeIfPresent(draftTaskId, forKey: .draftTaskId)
        try c.encode(pendingUploads, forKey: .pendingUploads)
        try c.encodeIfPresent(lastSyncCursor, forKey: .lastSyncCursor)
        try c.encode(shiftIdempotencyKeys, forKey: .shiftIdempotencyKeys)
        try c.encode(draftReportCreateKey, forKey: .draftReportCreateKey)
        try c.encode(updatedAt, forKey: .updatedAt)
    }

    static func empty() -> AppStateStore {
        AppStateStore(
            selectedProjectId: nil,
            shift: ShiftState(dayId: nil, startedAt: nil, endedAt: nil),
            draftReportId: nil,
            draftTaskId: nil,
            pendingUploads: [],
            lastSyncCursor: nil,
            shiftIdempotencyKeys: [:],
            draftReportCreateKey: [:],
            updatedAt: ISO8601DateFormatter().string(from: Date())
        )
    }
}

final class AppStateStoreManager: ObservableObject {
    static let shared = AppStateStoreManager()
    private let fileManager = FileManager.default
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    private let queue = DispatchQueue(label: "com.workerlite.appstate.store", qos: .userInitiated)

    @Published private(set) var state: AppStateStore

    private var fileURL: URL? {
        guard let dir = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else { return nil }
        let subdir = dir.appendingPathComponent("WorkerLite", isDirectory: true)
        try? fileManager.createDirectory(at: subdir, withIntermediateDirectories: true)
        return subdir.appendingPathComponent("app_state.json")
    }

    init() {
        self.state = Self.load(from: nil) ?? AppStateStore.empty()
    }

    private static func load(from url: URL?) -> AppStateStore? {
        let fm = FileManager.default
        let dir = fm.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
        let subdir = dir?.appendingPathComponent("WorkerLite", isDirectory: true)
        let file = (url ?? subdir?.appendingPathComponent("app_state.json"))!
        guard fm.fileExists(atPath: file.path),
              let data = try? Data(contentsOf: file) else { return nil }
        let decoder = JSONDecoder()
        return try? decoder.decode(AppStateStore.self, from: data)
    }

    func loadFromDisk() {
        queue.async { [weak self] in
            guard let self = self, let url = self.fileURL else { return }
            if let data = try? Data(contentsOf: url),
               let decoded = try? self.decoder.decode(AppStateStore.self, from: data) {
                DispatchQueue.main.async { self.state = decoded }
            }
        }
    }

    func save(_ block: (inout AppStateStore) -> Void) {
        var copy = state
        block(&copy)
        copy.updatedAt = ISO8601DateFormatter().string(from: Date())
        state = copy
        persist(copy)
        LocalReminderService.update(from: copy)
    }

    func persist(_ value: AppStateStore) {
        guard let url = fileURL else { return }
        queue.async { [weak self] in
            guard let self = self,
                  let data = try? self.encoder.encode(value) else { return }
            let temp = url.deletingLastPathComponent().appendingPathComponent(UUID().uuidString + ".tmp")
            do {
                try data.write(to: temp)
                _ = try? self.fileManager.replaceItemAt(url, withItemAt: temp)
            } catch {
                try? self.fileManager.removeItem(at: temp)
            }
        }
    }

    var hasPendingUploads: Bool {
        state.pendingUploads.contains { $0.phase != "done" }
    }

    var pendingCount: Int {
        state.pendingUploads.filter { $0.phase != "done" }.count
    }
}
