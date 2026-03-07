//
//  BackgroundUploadService.swift
//  AiStroykaWorker
//
//  Phase 7.4 — URLSession background uploads; taskId↔operationId mapping; delegate completes ops.
//

import Foundation
import UIKit

private let kBackgroundSessionIdentifier = "com.aistroyka.workerlite.uploads"

/// Persists taskIdentifier (Int) → operationId (String) for reattach after relaunch.
private final class UploadTaskMappingStore {
    private let lock = NSLock()
    private var map: [Int: String] = [:]
    private let fileManager = FileManager.default
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    private var fileURL: URL? {
        guard let dir = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else { return nil }
        let sub = dir.appendingPathComponent("AiStroykaWorker", isDirectory: true)
        try? fileManager.createDirectory(at: sub, withIntermediateDirectories: true)
        return sub.appendingPathComponent("upload_task_mapping.json")
    }

    init() {
        load()
    }

    func add(taskIdentifier: Int, operationId: String) {
        lock.lock()
        map[taskIdentifier] = operationId
        let copy = map
        lock.unlock()
        persist(copy)
    }

    func operationId(for taskIdentifier: Int) -> String? {
        lock.lock()
        let id = map[taskIdentifier]
        lock.unlock()
        return id
    }

    func remove(taskIdentifier: Int) {
        lock.lock()
        map.removeValue(forKey: taskIdentifier)
        let copy = map
        lock.unlock()
        persist(copy)
    }

    private func load() {
        guard let url = fileURL, let data = try? Data(contentsOf: url),
              let decoded = try? decoder.decode([String: String].self, from: data) else { return }
        let intKeyed = Dictionary(uniqueKeysWithValues: decoded.compactMap { k, v in Int(k).map { ($0, v) } })
        lock.lock()
        map = intKeyed
        lock.unlock()
    }

    private func persist(_ map: [Int: String]) {
        guard let url = fileURL else { return }
        let stringKeyed = Dictionary(uniqueKeysWithValues: map.map { ("\($0.key)", $0.value) })
        guard let data = try? encoder.encode(stringKeyed) else { return }
        let temp = url.deletingLastPathComponent().appendingPathComponent(UUID().uuidString + ".tmp")
        try? data.write(to: temp)
        _ = try? fileManager.replaceItemAt(url, withItemAt: temp)
        try? fileManager.removeItem(at: temp)
    }
}

final class BackgroundUploadService: NSObject {
    static let shared = BackgroundUploadService()

    private let mappingStore = UploadTaskMappingStore()
    private var session: URLSession!
    private let pendingDir: URL? = {
        guard let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else { return nil }
        let sub = dir.appendingPathComponent("AiStroykaWorker", isDirectory: true).appendingPathComponent("upload_pending", isDirectory: true)
        try? FileManager.default.createDirectory(at: sub, withIntermediateDirectories: true)
        return sub
    }()

    /// Call from AppDelegate/SceneDelegate when handleEventsForBackgroundURLSession is invoked.
    var backgroundCompletionHandler: (() -> Void)?

    override init() {
        super.init()
        let config = URLSessionConfiguration.background(withIdentifier: kBackgroundSessionIdentifier)
        config.sessionSendsLaunchEvents = true
        config.isDiscretionary = false
        session = URLSession(configuration: config, delegate: self, delegateQueue: .main)
    }

    /// Call once at app launch to reattach to existing session (same identifier).
    func recreateSessionIfNeeded() {
        if session == nil {
            let config = URLSessionConfiguration.background(withIdentifier: kBackgroundSessionIdentifier)
            config.sessionSendsLaunchEvents = true
            config.isDiscretionary = false
            session = URLSession(configuration: config, delegate: self, delegateQueue: .main)
        }
    }

    /// Schedules upload; op stays .running until delegate marks success/failure.
    func scheduleUpload(operationId: String, storagePath: String, data: Data, token: String) throws {
        guard let dir = pendingDir else { throw NSError(domain: "BackgroundUpload", code: -1, userInfo: [NSLocalizedDescriptionKey: "No pending dir"]) }
        let fileURL = dir.appendingPathComponent("\(operationId).bin")
        try data.write(to: fileURL)

        let base = Config.supabaseURL.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let urlString = "\(base)/storage/v1/object/media/\(storagePath)"
        guard let url = URL(string: urlString) else {
            try? FileManager.default.removeItem(at: fileURL)
            throw NSError(domain: "BackgroundUpload", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid storage URL"])
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("image/jpeg", forHTTPHeaderField: "Content-Type")

        let task = session.uploadTask(with: request, fromFile: fileURL)
        mappingStore.add(taskIdentifier: task.taskIdentifier, operationId: operationId)
        task.resume()
    }

    private func cleanupFile(operationId: String) {
        guard let dir = pendingDir else { return }
        let fileURL = dir.appendingPathComponent("\(operationId).bin")
        try? FileManager.default.removeItem(at: fileURL)
    }

    private func markUploadSucceeded(operationId: String, taskId: Int, objectPath: String, sizeBytes: Int) {
        OperationQueueStore.shared.update(id: operationId) {
            $0.state = .succeeded
            $0.attemptCount += 1
            $0.lastErrorCode = nil
            $0.lastErrorMessage = nil
            $0.payload.objectPath = objectPath
            $0.payload.sizeBytes = sizeBytes
        }
        mappingStore.remove(taskIdentifier: taskId)
        cleanupFile(operationId: operationId)
        DispatchQueue.main.async { OperationQueueExecutor.shared.runLoop() }
    }

    private func markUploadFailed(operationId: String, taskId: Int, retryable: Bool, message: String) {
        let opStore = OperationQueueStore.shared
        guard let op = opStore.operation(id: operationId) else {
            mappingStore.remove(taskIdentifier: taskId)
            cleanupFile(operationId: operationId)
            return
        }
        let attempt = op.attemptCount + 1
        opStore.update(id: operationId) {
            $0.state = .queued
            $0.attemptCount = attempt
            $0.lastErrorMessage = message
            $0.nextAttemptAt = Self.nextAttemptDate(attempt: attempt)
        }
        mappingStore.remove(taskIdentifier: taskId)
        cleanupFile(operationId: operationId)
        DispatchQueue.main.async { OperationQueueExecutor.shared.runLoop() }
    }

    private static func nextAttemptDate(attempt: Int) -> String {
        let baseSeconds = 2.0
        let sec = min(pow(baseSeconds, Double(attempt)) + Double.random(in: 0...1), 300)
        return ISO8601DateFormatter().string(from: Date().addingTimeInterval(sec))
    }
}

extension BackgroundUploadService: URLSessionDelegate {
    func urlSessionDidFinishEvents(forBackgroundURLSession session: URLSession) {
        DispatchQueue.main.async {
            self.backgroundCompletionHandler?()
            self.backgroundCompletionHandler = nil
        }
    }
}

extension BackgroundUploadService: URLSessionTaskDelegate {
    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        let taskId = task.taskIdentifier
        guard let operationId = mappingStore.operationId(for: taskId) else { return }

        if let err = error {
            let retryable = (err as NSError).code == NSURLErrorNetworkConnectionLost || (err as NSError).code == NSURLErrorTimedOut
            markUploadFailed(operationId: operationId, taskId: taskId, retryable: retryable, message: err.localizedDescription)
            return
        }
        guard let response = task.response as? HTTPURLResponse else {
            markUploadFailed(operationId: operationId, taskId: taskId, retryable: true, message: "No response")
            return
        }
        guard (200...299).contains(response.statusCode) else {
            let retryable = response.statusCode == 429 || response.statusCode >= 500
            markUploadFailed(operationId: operationId, taskId: taskId, retryable: retryable, message: "HTTP \(response.statusCode)")
            return
        }

        let opStore = OperationQueueStore.shared
        guard let op = opStore.operation(id: operationId) else {
            cleanupFile(operationId: operationId)
            mappingStore.remove(taskIdentifier: taskId)
            return
        }
        let pathInBucket = op.payload.uploadPath ?? ""
        let path = pathInBucket.hasPrefix("media/") ? String(pathInBucket.dropFirst(6)) : pathInBucket
        let photoItemId = op.payload.photoItemId ?? String(operationId.prefix(8))
        let filename = "\(photoItemId).jpg"
        let objectPath = "media/\(path)/\(filename)"
        let sizeBytes = op.payload.sizeBytes ?? 0
        markUploadSucceeded(operationId: operationId, taskId: taskId, objectPath: objectPath, sizeBytes: sizeBytes)
    }
}
