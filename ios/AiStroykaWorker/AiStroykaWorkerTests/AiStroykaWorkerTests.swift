//
//  AiStroykaWorkerTests.swift
//  AiStroykaWorkerTests
//
//  Phase 7.4 — Queue storage and reliability tests.
//

import XCTest
@testable import AiStroykaWorker

final class AiStroykaWorkerTests: XCTestCase {

    private var tempDir: URL!

    override func setUpWithError() throws {
        tempDir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: tempDir)
    }

    // MARK: - Stage 1: Durable queue storage

    /// Crash-safe: partial/invalid JSON on disk is recovered as empty list.
    func testOperationQueueStore_RecoveryFromPartialOrInvalidFile() throws {
        let fileURL = tempDir.appendingPathComponent("operations.json")
        try "{ \"id\": \"broken".write(to: fileURL, atomically: true, encoding: .utf8)

        let store = OperationQueueStore(customFileURL: fileURL)
        XCTAssertEqual(store.operations.count, 0)
        XCTAssertEqual(store.pendingCount(), 0)
    }

    /// Concurrent enqueue does not corrupt store; all ops present, no duplicates.
    func testOperationQueueStore_ConcurrentEnqueue_NoCorruption() throws {
        let fileURL = tempDir.appendingPathComponent("operations.json")
        let store = OperationQueueStore(customFileURL: fileURL)
        let count = 200
        let group = DispatchGroup()
        for i in 0..<count {
            group.enter()
            DispatchQueue.global(qos: .userInitiated).async {
                let op = Self.makeQueuedOperation(id: "op-\(i)", type: .syncAck)
                store.add(op)
                group.leave()
            }
        }
        group.wait()

        XCTAssertEqual(store.operations.count, count)
        let ids = Set(store.operations.map(\.id))
        XCTAssertEqual(ids.count, count, "Duplicate ids indicate corruption")
    }

    // MARK: - Stage 5: Dependency ordering

    /// runnable returns only ops whose dependsOn are all in knownSucceededIds.
    func testOperationQueueStore_DependencyOrdering_RunnableRespectsDeps() throws {
        let fileURL = tempDir.appendingPathComponent("operations.json")
        let store = OperationQueueStore(customFileURL: fileURL)
        let a = Self.makeQueuedOperation(id: "a", type: .syncAck)
        let b = Self.makeQueuedOperation(id: "b", type: .syncAck)
        var c = Self.makeQueuedOperation(id: "c", type: .syncAck)
        c.dependsOn = ["a", "b"]
        store.add(a)
        store.add(b)
        store.add(c)
        XCTAssertNil(store.runnable(knownSucceededIds: []))
        XCTAssertNil(store.runnable(knownSucceededIds: ["a"]))
        XCTAssertNotNil(store.runnable(knownSucceededIds: ["a", "b"]))
        let runnable = store.runnable(knownSucceededIds: ["a", "b"])
        XCTAssertEqual(runnable?.id, "c")
    }

    /// Idempotency key is persisted with the op across store updates.
    func testOperationQueueStore_IdempotencyKeyPersisted() throws {
        let fileURL = tempDir.appendingPathComponent("operations.json")
        let store = OperationQueueStore(customFileURL: fileURL)
        let key = "idem-\(UUID().uuidString)"
        var op = Self.makeQueuedOperation(id: "op-1", type: .createReport)
        op.idempotencyKey = key
        store.add(op)
        store.update(id: "op-1") { $0.state = .running }
        let restored = OperationQueueStore(customFileURL: fileURL)
        XCTAssertEqual(restored.operation(id: "op-1")?.idempotencyKey, key)
    }

    // MARK: - Phase 7.7: task_id linkage (report started from task)

    /// createReport payload includes server task_id when started from task; value is preserved for API.
    func testCreateReportPayload_IncludesTaskIdWhenSet() throws {
        let serverTaskId = "550e8400-e29b-41d4-a716-446655440000"
        let payload = OperationPayload(dayId: "20260306", taskId: serverTaskId, reportId: nil, purpose: nil, photoItemId: nil, sessionId: nil, uploadPath: nil, objectPath: nil, mimeType: nil, sizeBytes: nil, imageDataBase64: nil, cursor: nil)
        XCTAssertEqual(payload.taskId, serverTaskId)

        let fileURL = tempDir.appendingPathComponent("operations.json")
        let store = OperationQueueStore(customFileURL: fileURL)
        let op = QueuedOperation(
            id: "createReport-draft1",
            type: .createReport,
            payload: payload,
            idempotencyKey: "key-1",
            dependsOn: [],
            state: .queued,
            attemptCount: 0,
            nextAttemptAt: nil,
            lastErrorCode: nil,
            lastErrorMessage: nil,
            createdAt: ISO8601DateFormatter().string(from: Date()),
            updatedAt: ISO8601DateFormatter().string(from: Date()),
            resultReportId: nil,
            resultSessionId: nil,
            resultUploadPath: nil
        )
        store.add(op)
        let restored = OperationQueueStore(customFileURL: fileURL)
        let found = restored.operation(id: "createReport-draft1")
        XCTAssertEqual(found?.payload.taskId, serverTaskId, "task_id (server UUID) must be preserved for report/create API")
    }

    /// submitReport is runnable only when all attach deps are succeeded.
    func testOperationQueueStore_SubmitDependsOnAllAttaches() throws {
        let fileURL = tempDir.appendingPathComponent("operations.json")
        let store = OperationQueueStore(customFileURL: fileURL)
        let createId = "createReport-draft1"
        let attach1Id = "attachMedia-before"
        let attach2Id = "attachMedia-after"
        let submitId = "submitReport-draft1"
        store.add(Self.makeQueuedOperation(id: createId, type: .createReport))
        store.add(Self.makeQueuedOperation(id: attach1Id, type: .attachMedia))
        store.add(Self.makeQueuedOperation(id: attach2Id, type: .attachMedia))
        var submit = Self.makeQueuedOperation(id: submitId, type: .submitReport)
        submit.dependsOn = [createId, attach1Id, attach2Id]
        store.add(submit)
        XCTAssertNil(store.runnable(knownSucceededIds: []))
        XCTAssertNil(store.runnable(knownSucceededIds: [createId]))
        XCTAssertNil(store.runnable(knownSucceededIds: [createId, attach1Id]))
        let runnable = store.runnable(knownSucceededIds: [createId, attach1Id, attach2Id])
        XCTAssertEqual(runnable?.id, submitId)
    }

    private static func makeQueuedOperation(id: String, type: OperationType) -> QueuedOperation {
        let now = ISO8601DateFormatter().string(from: Date())
        return QueuedOperation(
            id: id,
            type: type,
            payload: OperationPayload(),
            idempotencyKey: "key-\(id)",
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
    }
}
