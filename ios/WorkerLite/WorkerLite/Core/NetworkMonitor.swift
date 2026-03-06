//
//  NetworkMonitor.swift
//  WorkerLite
//
//  Phase 7.2 — Network path monitoring for offline queue replay.
//

import Foundation
import Network

final class NetworkMonitor: ObservableObject {
    static let shared = NetworkMonitor()
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "com.workerlite.network")

    @Published private(set) var isConnected: Bool = true

    var onBecameReachable: (() -> Void)?

    init() {
        monitor.pathUpdateHandler = { [weak self] path in
            let connected = path.status == .satisfied
            DispatchQueue.main.async {
                let wasOffline = self?.isConnected == false
                self?.isConnected = connected
                if wasOffline && connected {
                    self?.onBecameReachable?()
                }
            }
        }
        monitor.start(queue: queue)
    }

    deinit {
        monitor.cancel()
    }
}
