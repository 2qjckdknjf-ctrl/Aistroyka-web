import Foundation

/// Serializes download and decoding together, so originals cannot accumulate before decoding.
public actor PhotoPreviewQueue {
    public static let shared = PhotoPreviewQueue()
    private var tail: Task<Void, Never>?
    private var tailId: UUID?

    public init() {}

    public func run<Value: Sendable>(_ operation: @escaping @Sendable () async throws -> Value) async throws -> Value {
        let previous = tail
        let id = UUID()
        let work = Task.detached(priority: .userInitiated) {
            await previous?.value
            try Task.checkCancellation()
            return try await operation()
        }
        tail = Task { _ = await work.result }
        tailId = id
        defer { if tailId == id { tail = nil; tailId = nil } }
        return try await withTaskCancellationHandler(operation: { try await work.value }, onCancel: { work.cancel() })
    }
}
