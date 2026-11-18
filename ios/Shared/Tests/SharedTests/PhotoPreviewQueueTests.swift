import XCTest
@testable import Shared

private actor PreviewConcurrencyProbe {
    var active = 0
    var maximum = 0
    var starts = 0
    func enter() { active += 1; maximum = max(maximum, active); starts += 1 }
    func leave() { active -= 1 }
    func stats() -> (Int, Int) { (maximum, starts) }
}

final class PhotoPreviewQueueTests: XCTestCase {
    func testSerializesWholeDownloadAndDecodeOperationAwayFromMainThread() async throws {
        let queue = PhotoPreviewQueue(), probe = PreviewConcurrencyProbe()
        try await withThrowingTaskGroup(of: Int.self) { group in
            for index in 0..<9 {
                group.addTask {
                    try await queue.run {
                        XCTAssertFalse(Thread.isMainThread)
                        await probe.enter()
                        try await Task.sleep(nanoseconds: 10_000_000)
                        await probe.leave()
                        return index
                    }
                }
            }
            var results = Set<Int>()
            for try await value in group { results.insert(value) }
            XCTAssertEqual(results.count, 9)
        }
        let stats = await probe.stats()
        XCTAssertEqual(stats.0, 1); XCTAssertEqual(stats.1, 9)
    }

    func testFailureDoesNotBlockLaterPreviews() async throws {
        let queue = PhotoPreviewQueue()
        do { let _: Int = try await queue.run { throw CancellationError() }; XCTFail("Expected failure") }
        catch is CancellationError {}
        let value = try await queue.run { 7 }
        XCTAssertEqual(value, 7)
    }

    func testCanceledQueuedWorkNeverStartsAndQueueRecovers() async throws {
        let queue = PhotoPreviewQueue(), entered = expectation(description: "First preview entered")
        let first = Task { try await queue.run { entered.fulfill(); try await Task.sleep(nanoseconds: 100_000_000); return 1 } }
        await fulfillment(of: [entered], timeout: 2)
        let canceled = Task { try await queue.run { XCTFail("Canceled preview started"); return 2 } }
        canceled.cancel()
        _ = try await first.value
        do { _ = try await canceled.value; XCTFail("Cancellation lost") }
        catch is CancellationError {}
        let value = try await queue.run { 3 }; XCTAssertEqual(value, 3)
    }
}
