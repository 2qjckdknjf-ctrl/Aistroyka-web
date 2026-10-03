import SwiftUI
import Shared

@main
struct AiStroykaCustomerApp: App {
    @StateObject private var sessionState = CustomerSessionState()

    var body: some Scene {
        WindowGroup {
            CustomerRootView()
                .environmentObject(sessionState)
                .preferredColorScheme(.dark)
        }
    }
}
