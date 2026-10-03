import SwiftUI

struct CustomerHomeView: View {
    @EnvironmentObject var sessionState: CustomerSessionState

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                Text(NSLocalizedString("cust_home_title", comment: ""))
                    .font(.title2.weight(.semibold))
                    .foregroundStyle(Color.white)
                Text(NSLocalizedString("cust_home_empty", comment: ""))
                    .font(.body)
                    .foregroundStyle(Color.white.opacity(0.7))
                    .accessibilityIdentifier("pilot_customer_home_empty")
                Spacer()
            }
            .padding(24)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(Color.black.ignoresSafeArea())
            .navigationTitle("AISTROYKA")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(NSLocalizedString("cust_sign_out", comment: "")) {
                        Task { await sessionState.signOut() }
                    }
                    .accessibilityIdentifier("pilot_customer_sign_out")
                }
            }
        }
    }
}
