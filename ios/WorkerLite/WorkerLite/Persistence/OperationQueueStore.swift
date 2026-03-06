//
//  OperationQueueStore.swift
//  WorkerLite
//
//  Phase 7.3/7.4 — Persistent operation queue. Atomic file-based JSON, serialized access, recovery on corrupt.
//

import Foundation

final class OperationQueueStore: ObservableObject {
    static let shared = OperationQueueStore()
    private let fileManager = FileManager.default
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    private let lock = NSLock()
    private let persistQueue = DispatchQueue(label: "com.workerlite.ops.persist", qos: .userInitiated)

    /// Lock-protected source of truth; @Published only updated on main for UI.
    private var backing: [QueuedOperation] = []
    @Published private(set) var operations: [QueuedOperation] = []

    /// For tests only: use this file instead of Application Support.
    private var customFileURL: URL?

    private var fileURL: URL? {
        if let custom = customFileURL { return custom }
        guard let dir = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else { return nil }
        let subdir = dir.appendingPathComponent("WorkerLite", isDirectory: true)
        try? fileManager.createDirectory(at: subdir, withIntermediateDirectories: true)
        return subdir.appendingPathComponent("operations.json")
    }

    init() {
        loadFromDiskSync()
    }

    /// Test-only: init with a specific file URL so tests don't touch app storage.
    init(customFileURL: URL) {
        self.customFileURL = customFileURL
        loadFromDiskSync()
    }

    /// Load from disk synchronously at init; on decode failure use empty array (crash-safe).
    private func loadFromDiskSync() {
        guard let url = fileURL else { return }
        var list: [QueuedOperation] = []
        if let data = try? Data(contentsOf: url) {
            list = (try? decoder.decode([QueuedOperation].self, from: data)) ?? []
        }
        lock.lock()
        backing = list
        lock.unlock()
        if Thread.isMainThread {
            operations = list
        } else {
            DispatchQueue.main.async { [weak self] in self?.operations = list }
        }
    }

    func add(_ op: QueuedOperation) {
        lock.lock()
        if backing.contains(where: { $0.id == op.id }) { lock.unlock(); return }
        backing.append(op)
        let copy = backing
        lock.unlock()
        publishAndPersist(copy)
    }

    func update(id: String, _ block: (inout QueuedOperation) -> Void) {
        lock.lock()
        guard let idx = backing.firstIndex(where: { $0.id == id }) else { lock.unlock(); return }
        var op = backing[idx]
        block(&op)
        op.updatedAt = ISO8601DateFormatter().string(from: Date())
        backing[idx] = op
        let copy = backing
        lock.unlock()
        publishAndPersist(copy)
    }

    private func publishAndPersist(_ list: [QueuedOperation]) {
        if Thread.isMainThread {
            operations = list
        } else {
            DispatchQueue.main.async { [weak self] in self?.operations = list }
        }
        persistQueue.async { [weak self] in self?.persistSync(list) }
    }

    func pendingCount() -> Int {
        lock.lock()
        defer { lock.unlock() }
        return backing.filter { $0.state == .queued || $0.state == .running }.count
    }

    func operation(id: String) -> QueuedOperation? {
        lock.lock()
        defer { lock.unlock() }
        return backing.first { $0.id == id }
    }

    func runnable(knownSucceededIds: Set<String>) -> QueuedOperation? {
        let now = ISO8601DateFormatter().string(from: Date())
        lock.lock()
        let list = backing
        lock.unlock()
        return list.first { op in
            guard op.state == .queued else { return false }
            let depsSatisfied = op.dependsOn.allSatisfy { knownSucceededIds.contains($0) }
            guard depsSatisfied else { return false }
            if let next = op.nextAttemptAt, next > now { return false }
            return true
        }
    }

    func succeededIds() -> Set<String> {
        lock.lock()
        defer { lock.unlock() }
        return Set(backing.filter { $0.state == .succeeded }.map(\.id))
    }

    /// Atomic write: temp file then replace. Call from serialQueue only.
    private func persistSync(_ list: [QueuedOperation]) {
        guard let url = fileURL, let data = try? encoder.encode(list) else { return }
        let temp = url.deletingLastPathComponent().appendingPathComponent(UUID().uuidString + ".tmp")
        do {
            try data.write(to: temp)
            _ = try? fileManager.replaceItemAt(url, withItemAt: temp)
        } catch {
            try? fileManager.removeItem(at: temp)
        }
    }
}
