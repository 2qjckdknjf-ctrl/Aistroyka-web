//
//  SyncService.swift
//  AiStroykaWorker
//
//  Phase 7.2 — Sync client: bootstrap, changes, ack. Persists cursor; handles 409 must_bootstrap.
//

import Foundation

enum SyncStatus: String {
    case idle
    case synced
    case syncing
    case needsBootstrap
    case offline
    case error
}

@MainActor
final class SyncService: ObservableObject {
    static let shared = SyncService()
    @Published private(set) var status: SyncStatus = .idle
    @Published private(set) var lastError: String?

    private let store = AppStateStoreManager.shared
    private let network = NetworkMonitor.shared
    private var syncTask: Task<Void, Never>?

    private init() {}

    /// Current cursor from persisted store (numeric, or 0 if none).
    var persistedCursor: Int {
        guard let s = store.state.lastSyncCursor, let n = Int(s) else { return 0 }
        return n
    }

    /// Persist cursor to store.
    func saveCursor(_ cursor: Int) {
        store.save { $0.lastSyncCursor = String(cursor) }
    }

    /// Run one full sync cycle: bootstrap if needed, then changes + ack until no more. Handles 409 → bootstrap.
    func runSyncIfOnline() {
        guard network.isConnected else {
            status = .offline
            return
        }
        syncTask?.cancel()
        syncTask = Task {
            await performSyncLoop()
        }
    }

    /// Stops any running sync.
    func cancelSync() {
        syncTask?.cancel()
        syncTask = nil
        if status == .syncing { status = .idle }
    }

    private func performSyncLoop() async {
        status = .syncing
        lastError = nil
        var cursor = persistedCursor
        var needsBootstrap = (cursor == 0)

        repeat {
            if Task.isCancelled { break }
            if !network.isConnected {
                status = .offline
                return
            }

            if needsBootstrap {
                do {
                    let result = try await WorkerAPI.syncBootstrap()
                    let newCursor = result.cursor ?? 0
                    saveCursor(newCursor)
                    cursor = newCursor
                    needsBootstrap = false
                } catch {
                    lastError = (error as? APIError)?.message ?? error.localizedDescription
                    status = .error
                    return
                }
            }

            do {
                let response = try await WorkerAPI.syncChanges(cursor: cursor, limit: 100)
                let nextCursor = response.nextCursor ?? cursor
                if let changes = response.data?.changes, !changes.isEmpty {
                    // Apply changes locally if needed (pilot: we only persist cursor; full apply is optional).
                }
                try await WorkerAPI.syncAck(cursor: nextCursor, idempotencyKey: "sync-ack-\(DeviceContext.deviceId)-\(nextCursor)")
                saveCursor(nextCursor)
                cursor = nextCursor
                if response.data?.changes?.isEmpty ?? true {
                    break
                }
            } catch let err as SyncConflictError {
                if err.mustBootstrap {
                    needsBootstrap = true
                    saveCursor(err.serverCursor)
                    cursor = err.serverCursor
                } else {
                    lastError = "Sync conflict (hint: \(err.body.serverCursor ?? 0))"
                    status = .needsBootstrap
                    return
                }
            } catch {
                lastError = (error as? APIError)?.message ?? error.localizedDescription
                status = .error
                return
            }
        } while true

        status = .synced
    }
}
