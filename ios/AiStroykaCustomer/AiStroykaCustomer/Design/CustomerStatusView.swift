import SwiftUI

struct CustomerStatusView: View {
    enum Kind { case loading, unauthorized, error }

    let kind: Kind
    let message: String
    var actionTitle: String?
    var action: (() -> Void)?

    var body: some View {
        VStack(spacing: 16) {
            if kind == .loading {
                ProgressView()
                    .tint(.white)
            }
            Text(message)
                .multilineTextAlignment(.center)
                .foregroundStyle(Color.white)
                .padding(.horizontal, 24)
            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .buttonStyle(.borderedProminent)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black.ignoresSafeArea())
    }
}
