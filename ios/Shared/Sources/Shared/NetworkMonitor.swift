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

    private static var treatsNetworkAsConnectedForAutomation: Bool {
        let env = ProcessInfo.processInfo.environment
        if env["AISTROYKA_E2E"] == "1" || env["AISTROYKA_UI_TEST"] == "1" { return true }
        let args = ProcessInfo.processInfo.arguments
        return args.contains("-AISTROYKA_E2E") || args.contains("-AISTROYKA_UI_TEST")
    }

    public init() {
        monitor.pathUpdateHandler = { [weak self] path in
            let connected = path.status == .satisfied || Self.treatsNetworkAsConnectedForAutomation
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
