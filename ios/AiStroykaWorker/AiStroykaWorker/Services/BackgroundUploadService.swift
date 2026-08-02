//
//  BackgroundUploadService.swift
//  AiStroykaWorker
//
//  Phase 7.4 — URLSession background uploads; taskId↔operationId mapping; delegate completes ops.
//

import Foundation
import UIKit
import Shared

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
        if fileManager.fileExists(atPath: url.path) {
            _ = try? fileManager.replaceItemAt(url, withItemAt: temp)
            try? fileManager.removeItem(at: temp)
        } else {
            try? fileManager.moveItem(at: temp, to: url)
        }
    }
}

final class BackgroundUploadService: NSObject {
    static let shared = BackgroundUploadService()
    private let maxAttempts = 8

    private let mappingStore = UploadTaskMappingStore()
    private var session: URLSession!
    /// Retained for XCTest/E2E foreground uploads (local URLSession must not deallocate mid-transfer).
    private var e2eForegroundSession: URLSession?
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

    private static var isE2EAutomation: Bool {
        let env = ProcessInfo.processInfo.environment
        if env["AISTROYKA_E2E"] == "1" || env["AISTROYKA_UI_TEST"] == "1" { return true }
        let args = ProcessInfo.processInfo.arguments
        return args.contains("-AISTROYKA_E2E") || args.contains("-AISTROYKA_UI_TEST")
    }

    /// Synchronous foreground POST for XCTest/E2E (same request shape as UploadManager).
    func uploadSynchronouslyForE2E(storagePath: String, data: Data, token: String) async throws {
        let base = Config.supabaseURL.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let urlString = "\(base)/storage/v1/object/media/\(storagePath)"
        guard let url = URL(string: urlString) else {
            throw NSError(domain: "BackgroundUpload", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid storage URL"])
        }
        let anon = Config.supabaseAnonKey.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !anon.isEmpty else {
            throw NSError(domain: "BackgroundUpload", code: -3, userInfo: [NSLocalizedDescriptionKey: "Missing SUPABASE_ANON_KEY for storage upload"])
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(anon, forHTTPHeaderField: "apikey")
        request.setValue("image/jpeg", forHTTPHeaderField: "Content-Type")
        request.setValue("true", forHTTPHeaderField: "x-upsert")
        request.httpBody = data
        request.timeoutInterval = 60
        let (body, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw NSError(domain: "BackgroundUpload", code: -2, userInfo: [NSLocalizedDescriptionKey: "No HTTP response"])
        }
        guard (200...299).contains(http.statusCode) else {
            let snippet = String(data: body.prefix(160), encoding: .utf8) ?? ""
            let detail = snippet.isEmpty ? "HTTP \(http.statusCode)" : "HTTP \(http.statusCode): \(snippet)"
            throw NSError(domain: "BackgroundUpload", code: http.statusCode, userInfo: [NSLocalizedDescriptionKey: detail])
        }
    }

    /// Schedules upload; op stays .running until delegate marks success/failure.
    /// Under XCTest/E2E, prefer `uploadSynchronouslyForE2E` from the executor instead.
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

        if Self.isE2EAutomation {
            let syntheticId = Int.random(in: 1_000_000...9_999_999)
            mappingStore.add(taskIdentifier: syntheticId, operationId: operationId)
            if e2eForegroundSession == nil {
                e2eForegroundSession = URLSession(configuration: .default)
            }
            let foreground = e2eForegroundSession!
            let task = foreground.uploadTask(with: request, fromFile: fileURL) { [weak self] _, response, error in
                guard let self else { return }
                let finish: () -> Void = {
                    if let error {
                        let retryable = (error as NSError).code == NSURLErrorNetworkConnectionLost
                            || (error as NSError).code == NSURLErrorTimedOut
                        self.markUploadFailed(
                            operationId: operationId,
                            taskId: syntheticId,
                            retryable: retryable,
                            message: error.localizedDescription
                        )
                        return
                    }
                    guard let http = response as? HTTPURLResponse else {
                        self.markUploadFailed(operationId: operationId, taskId: syntheticId, retryable: true, message: "No response")
                        return
                    }
                    guard (200...299).contains(http.statusCode) else {
                        let retryable = http.statusCode == 429 || http.statusCode >= 500
                        self.markUploadFailed(
                            operationId: operationId,
                            taskId: syntheticId,
                            retryable: retryable,
                            message: "HTTP \(http.statusCode)"
                        )
                        return
                    }
                    let opStore = OperationQueueStore.shared
                    guard let op = opStore.operation(id: operationId) else {
                        self.cleanupFile(operationId: operationId)
                        self.mappingStore.remove(taskIdentifier: syntheticId)
                        return
                    }
                    let sizeBytes = op.payload.sizeBytes ?? data.count
                    if let persisted = op.payload.objectPath, !persisted.isEmpty {
                        self.markUploadSucceeded(operationId: operationId, taskId: syntheticId, objectPath: persisted, sizeBytes: sizeBytes)
                        return
                    }
                    let pathInBucket = op.payload.uploadPath ?? ""
                    let path = pathInBucket.hasPrefix("media/") ? String(pathInBucket.dropFirst(6)) : pathInBucket
                    let photoItemId = op.payload.photoItemId ?? String(operationId.prefix(8))
                    let filename = "\(photoItemId.prefix(8)).jpg"
                    let objectPath = "media/\(path)/\(filename)"
                    self.markUploadSucceeded(operationId: operationId, taskId: syntheticId, objectPath: objectPath, sizeBytes: sizeBytes)
                }
                if Thread.isMainThread {
                    finish()
                } else {
                    DispatchQueue.main.async(execute: finish)
                }
            }
            task.resume()
            return
        }

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
        if retryable {
            let attempt = op.attemptCount + 1
            if attempt >= maxAttempts {
                opStore.update(id: operationId) {
                    $0.state = .failed_permanent
                    $0.attemptCount = attempt
                    $0.lastErrorMessage = "Max attempts (\(maxAttempts)) reached. Retry from app. Last error: \(message)"
                    $0.nextAttemptAt = nil
                }
            } else {
                opStore.update(id: operationId) {
                    $0.state = .queued
                    $0.attemptCount = attempt
                    $0.lastErrorMessage = message
                    $0.nextAttemptAt = Self.nextAttemptDate(attempt: attempt)
                }
            }
        } else {
            opStore.update(id: operationId) {
                $0.state = .failed_permanent
                $0.attemptCount = op.attemptCount + 1
                $0.lastErrorMessage = message
                $0.nextAttemptAt = nil
            }
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
        let sizeBytes = op.payload.sizeBytes ?? 0
        if let persisted = op.payload.objectPath, !persisted.isEmpty {
            markUploadSucceeded(operationId: operationId, taskId: taskId, objectPath: persisted, sizeBytes: sizeBytes)
            return
        }
        // Legacy fallback for in-flight operations scheduled before objectPath persistence.
        // Filename must match the uploaded one (photoItemId.prefix(8), see uploadBinary).
        let pathInBucket = op.payload.uploadPath ?? ""
        let path = pathInBucket.hasPrefix("media/") ? String(pathInBucket.dropFirst(6)) : pathInBucket
        let photoItemId = op.payload.photoItemId ?? String(operationId.prefix(8))
        let filename = "\(photoItemId.prefix(8)).jpg"
        let objectPath = "media/\(path)/\(filename)"
        markUploadSucceeded(operationId: operationId, taskId: taskId, objectPath: objectPath, sizeBytes: sizeBytes)
    }
}
