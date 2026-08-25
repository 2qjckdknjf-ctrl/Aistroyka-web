//
//  WorkerLocationService.swift
//  AiStroykaWorker
//
//  Location is requested only for an active or starting shift.
//

import CoreLocation
import Foundation

@MainActor
final class WorkerLocationService: NSObject, ObservableObject, CLLocationManagerDelegate {
    static let shared = WorkerLocationService()

    @Published var lastCoordinate: CLLocationCoordinate2D?
    @Published var lastAccuracy: CLLocationAccuracy?
    @Published var authorization: CLAuthorizationStatus
    @Published var lastError: String?

    private let manager = CLLocationManager()

    override init() {
        authorization = manager.authorizationStatus
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
    }

    func requestIfNeeded(scope: String) {
        guard scope != "never" else { return }
        switch manager.authorizationStatus {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse, .authorizedAlways:
            manager.requestLocation()
        default:
            lastError = NSLocalizedString("wrk_v43_location_denied", comment: "")
        }
    }

    func snapshotEvidence() -> (lat: Double, lon: Double, accuracy: Double)? {
        guard let lastCoordinate, let lastAccuracy else { return nil }
        return (lastCoordinate.latitude, lastCoordinate.longitude, lastAccuracy)
    }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        Task { @MainActor in
            self.authorization = manager.authorizationStatus
            if manager.authorizationStatus == .authorizedWhenInUse || manager.authorizationStatus == .authorizedAlways {
                manager.requestLocation()
            }
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let loc = locations.last else { return }
        Task { @MainActor in
            self.lastCoordinate = loc.coordinate
            self.lastAccuracy = loc.horizontalAccuracy
            self.lastError = nil
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in
            self.lastError = NSLocalizedString("wrk_v43_location_unavailable", comment: "")
        }
    }
}
