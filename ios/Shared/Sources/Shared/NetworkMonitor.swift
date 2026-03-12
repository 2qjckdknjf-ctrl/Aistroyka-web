//
//  NetworkMonitor.swift
//  Shared
//

import Foundation
import Network
import Combine

public final class NetworkMonitor: ObservableObject {
    public static let shared = NetworkMonitor()
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "com.aistroyka.network")

    @Published public private(set) var isConnected: Bool = true

    public var onBecameReachable: (() -> Void)?

    public init() {
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
